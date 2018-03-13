const fsys = require( './botfs.js');
const cmd = require( './commands.js');
const cacher = require( './cache.js' );
const Discord = require ( 'discord.js');

const Contexts = exports.Context = require( './botcontext.js');

var Bot;
exports.InitBot = ( client, master ) => {
	Bot = new DiscordBot( client, master );
	return Bot;
}

exports.GetBot = () => Bot;

class DiscordBot {

	get client() { return this._client;}
	get cache() { return this._cache; }
	get dispatch() { return this._dispatch;}
	get contexts() { return this._contexts;}
	get contextClasses() { return this._contextClasses; }
	get cmdPrefix() { return this._cmdPrefix; }

	/**
	 * 
	 * @param {Discord.Client} client
	 * @param {string} masterid - id of master user.
	 * @param {*} cmdPrefix 
	 */
	constructor( client, masterid ) {

		// map target discord obj to processing context.
		this._contexts = {};

		// classes to instantiate for each context.
		this._contextClasses = [];

		this._client = client;
		this._cache = new cacher.Cache( fsys.readData, fsys.writeData, fsys.fileExists, fsys.deleteData );

		this.loadConfig();

		this._dispatch = new cmd.Dispatch( this._cmdPrefix );

		this.loadPlugins();

		this._master = masterid;

		process.on( 'exit', ()=>this.onShutdown() );
		process.on( 'SIGINT', ()=>this.onShutdown() );

		client.setInterval(
			()=>{ this._cache.cleanup(60*1000*30); }, 60*1000*30 );
		client.setInterval(
			()=>{this._cache.backup(60*1000*15); }, 60*1000*15 );

		this.initClient();

		this.addCmd( 'backup', '!backup', (m)=>this.cmdBackup(m) );
		this.addCmd( 'archleave', '!archleave', (m)=>this.cmdLeaveGuild(m), {} );

	}

	loadConfig() {

		try {

			let config = require( './archconfig.json');
			this._spamblock = config.spamblock || {};
			this._cmdPrefix = config.cmdprefix || '!';
			this._plugsdir = config.pluginsdir;

		} catch ( e) { this._spamblock = {}; }

	}

	loadPlugins(){

		if ( !this._plugsdir) return;
		try {

			var plugins = require( './plugsupport.js' ).loadPlugins( this._plugsdir );
			this.addPlugins( plugins );

		} catch(e) { console.log(e);}
	}

	onShutdown() {
		if ( this._client ) {
			this._cache.backup();
			this._client.destroy();
			this._client = null;

		}
		process.exit(1);
	}

	addPlugins( plug_files ) {

		let plug, init, contClass;
		for( let i = plug_files.length-1; i >= 0; i-- ) {

			plug = plug_files[i];
			init = plug.init;
			if ( init && typeof(init) === 'function' ){
				plug.init( this );
			}

		}

	}

	/**
	 * Add class that will be instantiated on every running
	 * context.
	 * @param {class} cls 
	 */
	addContextClass( cls ) {

		this._contextClasses.push(cls);

		if ( this.client ) {
			this.client.guilds.forEach( (g, id) => {
				let c = this.getContext( g );
				console.log('adding class: ' + cls.name )
				c.addClass( cls );
			});
		}

	}

	initClient() {

		// NOTE: 'this' for events is always client.
		this._client.on( 'ready', ()=>this.initContexts());
		this._client.on( 'guildUnavailable', onGuildUnavail )

		this._client.on( 'resume', onResume );

		this._client.on( 'message', (m)=>this.onMessage(m) );

		this._client.on( 'presenceUpdate', onPresence );

	}

	initContexts() {

		console.log('client ready: ' + this._client.user.username + ' - (' + this._client.user.id + ')');

		try {
			let classes = this._contextClasses;
			if ( classes.length === 0 ) {
				console.log('no classes to instantiate.');
				return;
			}

			this.client.guilds.forEach( (g, id) => {
				this.getContext(g);
			});
		} catch ( e) { console.log(e);}

	}

	addCmd( name, usage, func, opts=null ) {
		this._dispatch.add( name, usage, func, opts );
	}

	// command instantiates context class
	addContextCmd( name, usage, func, plugClass, opts=null ) {
		this._dispatch.addContextCmd( name, usage, func, plugClass, opts );
	}

	onMessage( m ) {

		if ( m.author.id === this._client.user.id ) return;
		if ( this.spamcheck(m) ) return;

		let command = this._dispatch.getCommand( m.content );

		if ( !command ) return;

		if ( command.isDirect ) {

			this._dispatch.dispatch( command, [m] );

		} else {

			// context command.
			// get Context for cmd routing.

			let context = this.getMsgContext( m );
			let error = this._dispatch.routeCmd( context, command, [m] );
			if ( error ) m.channel.send( error );

		}

	}

	async cmdBackup( m ) {

		if ( m.author.id === this._master ) {
			await this._cache.backup();
			await m.reply( 'backup complete.');
		}

	}

	cmdLeaveGuild( m ) {

		if ( m.author.id === this._master && m.guild ) {
			m.guild.leave();
			console.log('leaving guild: ' + m.guild.name );
		}

	}

	spamcheck(m) {

		if ( !m.guild) return false;
		let allow = this._spamblock[m.guild.id];
		if ( !allow ) return false;
		if ( allow[m.channel.id]) return false;
		return true;

	}

	/**
	 * Return a Context associated with the message channel.
	 * @param {Discord.Message} m 
	 */
	getMsgContext( m ) {

		let type = m.channel.type;
		let idobj;

		if ( type === 'text' || type === 'voice ') idobj = m.guild;
		else if ( type === 'group' ) idobj = m.channel;
		else idobj = m.channel.recipient;

		return this._contexts[ idobj.id ] || this.makeContext( idobj, type );

	}

	/**
	 * 
	 * @param {*} idobj 
	 * @param {*} type 
	 */
	getContext( idobj, type=null ) {

		let id = idobj.id;
		if ( this._contexts.hasOwnProperty(id) ) {
			return this._contexts[id];
		}
		return this.makeContext( idobj, type );

	}

	makeContext( idobj, type ) {

		console.log( 'creating context for: ' + idobj.id );
		let context;

		if ( type === 'text' || !type || type === 'voice' )
			context = new Contexts.GuildContext( this, idobj, this._cache.makeSubCache( fsys.getGuildDir(idobj) ) );
		else if ( type === 'group' )
			context = new Contexts.GroupContext( this, idobj, this._cache.makeSubCache( fsys.getChannelDir(idobj) ) );
		else  context = new Contexts.UserContext( this, idobj, this._cache.makeSubCache( fsys.getUserDir(idobj)) );

		for( let i = this._contextClasses.length-1; i >= 0; i-- ) {
			context.addClass( this._contextClasses[i]);
		}

		this._contexts[idobj.id] = context;

		return context;

	}

	displayName( uObject ){
		if ( uObject instanceof Discord.GuildMember ){
			return uObject.displayName;
		}
		return uObject.username;

	}

	getSender( msg ) {

		if ( msg.member ) return msg.member;
		return msg.author;

	}

	// fetch data for abitrary key.
	async fetchKeyData( key ) {
		return await this._cache.fetch(key);
	}

	// associate data with key.
	async storeKeyData( key, data ){
		await this._cache.cache( key, data );
	}

	// get a key to associate with the
	// given chain of data objects.
	getDataKey( baseObj, ...subs ) {

		if ( baseObj instanceof Discord.Channel ) {
			return fsys.channelPath( baseObj, subs );
		} else if ( baseObj instanceof Discord.GuildMember ){
			return fsys.guildPath( baseObj.guild, subs );
		} else if ( baseObj instanceof Discord.Guild ){
			return fsys.guildPath( baseObj, subs );
		}

	}

	async fetchUserData( uObject ){

		let objPath;
		if ( uObject instanceof Discord.GuildMember ) {
			objPath = fsys.memberPath( uObject );
		} else {
			objPath = fsys.getUserDir( uObject );
		}
		return await this._cache.fetch( objPath );

	}

	async storeUserData( uObject, data ){

		let objPath;
		if ( uObject instanceof Discord.GuildMember ){
			objPath = fsys.memberPath( uObject );
	
		} else {
			objPath = fsys.getUserDir( uObject );
		}
		await this._cache.cache( objPath, data );

	}

	showUserNotFound( chan, user ) {
		chan.send( 'User \'' + user + '\' not found.');
	}

	/**
	 * Finds and returns the named user in the channel,
	 * or replies with an error message.
	 * @param {*} channel 
	 * @param {*} name 
	 */
	userOrShowErr( channel, name ) {

		if ( !name ) {
			channel.send( 'User name expected.');
			return null;
		}
		let member = this.findUser( channel, name );
		if ( !member ) channel.send( 'User \'' + name + '\' not found.');
		return member;

	}

	findUser( channel, name ) {

		if ( !channel ) return null;

		name = name.toLowerCase();
		switch ( channel.type ) {

			case 'text':
			case 'voice':

				let user = channel.guild.members.find( gm => gm.displayName.toLowerCase() === name );
				return user;
			case 'dm':
				if ( channel.recipient.username.toLowerCase() === name ) return channel.recipient;
				return null;
			case 'group':
				return channel.nicks.find( val => val.toLowerCase() === name );
		}

	}

	printCommand( chan, cmdname ) {

		let cmds = this._dispatch.commands;
		if ( cmds && cmds.hasOwnProperty( cmdname ) ) {

			let cmdInfo = cmds[cmdname];
			let usage = cmdInfo.usage;
			if ( !usage ) chan.send( 'No usage information found for command \'' + cmdname + '\'.');
			else chan.send( cmdname + ' usage: ' + cmdInfo.usage );


		} else chan.send( 'Command \'' + cmdname + '\' not found.' );

	}

	printCommands( chan ) {

		let str = 'Use help [cmd] for more information.\nAvailable commands:\n';
		let cmds = this._dispatch.commands;
		if ( cmds ) {

			let a = [];
			//let info;
			for( let k in cmds ) {

				if ( !cmds[k].hidden ) a.push(k);

			} //

			str += a.join(', ');

		}
		chan.send( str );

	}

} // class

function onPresence( oldGM, newGM ) {

	if ( newGM.id === Bot.client.user.id ) {
		console.log( 'presence update for bot.');
		if ( newGame.presence.status === 'online'){
			console.log( 'bot now online in guild: ' + newGM.guild.name );
		}
	}
}

function onGuildUnavail( g ) {
	console.log( 'guild unavailable: ' + g.name );
}

function onReady() {
	console.log( 'bot logged in as: ' + this.user.username );
}

function onResume( evtCount ) {
	console.log('resuming. missed ' + evtCount + ' events.');
}