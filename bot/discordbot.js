const fsys = require( './botfs.js');
const Dispatch = require( './dispatch.js');
const cacher = require( '../cache.js' );
const Discord = require ( 'discord.js');
const path = require( 'path' );
const display = require( '../display' );

const CONTENT_MAX = 1905;
exports.CONTENT_MAX = CONTENT_MAX;

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

	get directory() { return this._directory; }
	get saveDir() { return this._saveDir; }

	/**
	 * 
	 * @param {Discord.Client} client
	 * @param {string} masterid - id of master user.
	 * @param {string} [mainDir=null] - the main directory of the archbot program. Defaults to the directory of the main script
	 * being run.
	 */
	constructor( client, masterid, mainDir=null ) {

		// map target discord obj to processing context.
		this._contexts = {};

		this._directory = mainDir || path.dirname(  require.main.filename );

		// classes to instantiate for each context.
		this._contextClasses = [];

		this._client = client;

		this.loadConfig();
		fsys.setBaseDir( this._saveDir );

		this._cache = new cacher.Cache( fsys.readData, fsys.writeData, fsys.fileExists, fsys.deleteData );
		
		this._dispatch = new Dispatch( this._cmdPrefix );

		// maps id->context id.
		this.restoreProxies();

		this.loadPlugins();

		this._master = masterid;

		process.on( 'exit', ()=>this.onShutdown() );
		process.on( 'SIGINT', ()=>this.onShutdown() );

		client.setInterval(
			()=>{ this._cache.cleanup(60*1000*30); }, 60*1000*30 );
		client.setInterval(
			()=>{this._cache.backup(60*1000*15); console.log('ROUTINE BACKUP.'); }, 60*1000*15 );

		this.initClient();

		this.addCmd( 'backup', '!backup', (m)=>this.cmdBackup(m),
		{ access:0} );
		this.addCmd( 'archleave', '!archleave', (m)=>this.cmdLeaveGuild(m), {
			access:Discord.Permissions.FLAGS.ADMINISTRATOR
		} );
		this.addCmd( 'archquit', '!archquit', m=>this.cmdBotQuit(m), {} );
		this.addCmd( 'proxyme', '!proxyme', (m)=>this.cmdProxy(m) );
		this.addCmd( 'access', '!access cmd [permissions|roles]',
			(m, cmd, perm)=>this.cmdAccess(m, cmd, perm),
			{ minArgs:1, access:Discord.Permissions.FLAGS.ADMINISTRATOR }
		);
		this.addCmd( 'resetaccess', '!resetaccess cmd',
			(m,cmd)=>this.cmdResetAccess(m,cmd),
			{minArgs:1, maxArgs:1, access:Discord.Permissions.FLAGS.ADMINISTRATOR}
		);

	}

	loadConfig() {

		try {

			let config = require( '../archconfig.json');
			this._spamblock = config.spamblock || {};
			this._cmdPrefix = config.cmdprefix || '!';
			this._plugsdir = path.join( this._directory, config.pluginsdir );
			this._saveDir = path.join( this._directory, config.savedir || '/savedata/');

		} catch ( e) {
			this._cmdPrefix = '!';
			this._spamblock = {};
		}

	}

	loadPlugins(){

		if ( !this._plugsdir) return;

		try {

			var plugins = require( '../plugsupport.js' ).loadPlugins( this._plugsdir );
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

		// ensure context for every guild.
		if ( this.client ) {

			this.client.guilds.forEach( (g, id) => {

				this.getContext( g ).then( c=>{
					console.log('adding class: ' + cls.name )
					c.addClass(cls);
				});

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

	async onMessage( m ) {

		if ( m.author.id === this._client.user.id ) return;
		if ( this.spamcheck(m) ) return;

		let command = this._dispatch.getCommand( m.content );

		if ( !command ) return;

		// check command access.
		let context = await this.getMsgContext( m );
		if ( m.member && !this.testAccess(m, command, context ) ) {
			return m.reply( 'You do not have permission to use that command.');
		}

		if ( command.isDirect ) {

			this._dispatch.dispatch( command, [m] );

		} else {

			// context command.
			let error = this._dispatch.routeCmd( context, command, [m] );

			if ( !error ) return;
			else if ( error instanceof Promise ) {

				error.then( s=> {if ( s) m.channel.send(s);} );

			} else if ( typeof(error) === 'string' ) {
				m.channel.send( error );

			}

		}

	}

	testAccess( m, cmd, context ) {

		let allowed = context.canAccess( cmd.name, m.member );
		if ( allowed === undefined ) {

			// check default access.
			if ( !cmd.access) return true;
			console.log('TESTING PERMISSION: ' + cmd.access );

			return m.member.permissions.has( cmd.access );


		}

		return allowed;

	}

	/**
	 * Returns true if the given discord user is the bot owner.
	 * @param {Discord.User|string} u 
	 */
	isMaster( u ) {

		if ( u instanceof Discord.User ) return u.id === this._master;
		return u === this._master;
	}

	/**
	 * Backup unsaved Archbot cache items.
	 * @param {Message} m 
	 */
	async cmdBackup( m ) {

		if ( this.isMaster( m.author.id ) ) {
			await this._cache.backup( 0 );
			return m.reply( 'backup complete.');
		}
		return this.sendNoPerm(m);

	}

	/**
	 * Close the running Archbot program. Owner only.
	 * @param {Message} m 
	 */
	async cmdBotQuit(m) {

		if ( this.isMaster(m.author.id) ) {
			this.client.destroy();
		}
		return this.sendNoPerm(m);

	}

	/**
	 * Make Archbot leave the current guild.
	 * @param {Message} m 
	 */
	async cmdLeaveGuild( m ) {

		if ( this.isMaster( m.author.id ) && m.guild ) {
			m.guild.leave();
			console.log('leaving guild: ' + m.guild.name );
		}
		return this.sendNoPerm(m);

	}

	spamcheck(m) {

		if ( !m.guild) return false;
		let allow = this._spamblock[m.guild.id];
		if ( !allow ) return false;
		if ( allow[m.channel.id]) return false;
		return true;

	}

	/**
	 * Proxy the given context through the user's DM.
	 * @param {Message} m 
	 */
	async cmdProxy( m ) {

		// get context of the guild/channel to be proxied to user.
		let context = await this.getMsgContext(m);
	
		this.setProxy( m.author, context );
		return m.author.send( 'Proxy created.');

	}

	async cmdResetAccess( m, cmd ) {

		// unset any custom access.
		context.unsetAccess( cmd );

	}

	async cmdAccess( m, cmd, perm=undefined ) {

		let context = await this.getMsgContext( m );
		if ( perm === undefined ) {

		} else {

			context.setAccess( cmd, perm );

		}

	}

	getAccess( m, cmd ) {

		let access = context.getAccess( cmd );
		if ( access === undefined ) {
			return cmd.access;
		}
		return access;

	}

	/**
	 * Send a no-permission message.
	 * @param {Message} m 
	 */
	async sendNoPerm( m ) {
		return m.reply( 'You do not have permission to use that command.');
	}

	setProxy( user, context ) {

		this._contexts[user.id] = context;
		this._proxies[ user.id ] = context.sourceID;
		this.cacheKeyData( 'proxies', this._proxies );

	}

	async saveProxies() {
		return this.storeKeyData( 'proxies', this._proxies );
	}

	async restoreProxies() {

		this._proxies = {};
		let loaded = await this.fetchKeyData( 'proxies' );
		if ( loaded ) {
			this._proxies = Object.assign( this._proxies, loaded );
		}
		/*for( let k in this._proxies ) {
			console.log('proxy found for: ' + k );
		}*/

	}

	/**
	 * Return a Context associated with the message channel.
	 * @param {Discord.Message} m 
	 */
	async getMsgContext( m ) {

		let type = m.channel.type, idobj;

		if ( type === 'text' || type === 'voice ') idobj = m.guild;
		else if ( type === 'group' ) {

			idobj = m.channel;
			if ( this._proxies[idobj.id] ) return await this.getProxy( idobj, this._proxies[idobj.id] );

		} else {
	
			idobj = m.author;
			//check proxy
			if ( this._proxies[idobj.id] ) return await this.getProxy( idobj, this._proxies[idobj.id] );
	
		}

		return this._contexts[ idobj.id ] || await this.makeContext( idobj, type );

	}

	/**
	 * 
	 * @param {*} idobj 
	 */
	async getContext( idobj, type ) {

		let proxid = this._proxies[idobj.id];
		if ( proxid ) return await this.getProxy( idobj, proxid );

		return this._contexts[idobj.id] || await this.makeContext( idobj, type );

	}

	/**
	 * Get a context from the source id, mapping messages
	 * to the destobj.
	 * @param {*} destobj 
	 * @param {*} srcid 
	 */
	async getProxy( destobj, srcid ) {

		let con = this._contexts[srcid];
		if ( con ) return con;

		let proxob = this.findProxTarget( srcid );
		if ( proxob) return await this.makeContext( proxob );

		// proxy not found.
		console.log( 'ERROR: Proxy not found: ' + srcid );
		return this._contexts[destobj.id] || await this.makeContext( destobj );

	}

	findProxTarget( id ) {
		return this._client.guilds.get(id) || this.client.channels.get(id);
	}

	async makeContext( idobj, type ) {

		console.log( 'creating context for: ' + idobj.id );
		let context;

		if ( type === 'text' || !type || type === 'voice' )
			context = new Contexts.GuildContext( this, idobj, this._cache.makeSubCache( fsys.getGuildDir(idobj) ) );
		else if ( type === 'group' )
			context = new Contexts.GroupContext( this, idobj, this._cache.makeSubCache( fsys.getChannelDir(idobj) ) );
		else  context = new Contexts.UserContext( this, idobj, this._cache.makeSubCache( fsys.getUserDir(idobj)) );

		await context.init( this._contextClasses );

		this._contexts[idobj.id] = context;

		return context;

	}

	/**
	 * Gets a displayName for a discord user.
	 * @param {GuildMember|User} uObject
	 * @returns {string}
	 */
	displayName( uObject ){
		if ( uObject instanceof Discord.GuildMember ){
			return uObject.displayName;
		}
		return uObject.username;

	}

	/**
	 * Get the sender of a Message.
	 * @param {Message} msg
	 * @returns {GuildMember|User}
	 */
	getSender( msg ) {

		if ( msg.member ) return msg.member;
		return msg.author;

	}

	// fetch data for abitrary key.
	async fetchKeyData( key ) {
		return this._cache.fetch(key);
	}

	// associate data with key.
	async storeKeyData( key, data ){
		return this._cache.cache( key, data );
	}

	// get a key to associate with the
	// given chain of data objects.
	getDataKey( baseObj, ...subs ) {

		if ( baseObj instanceof Discord.Channel ) return fsys.channelPath( baseObj, subs );
		else if ( baseObj instanceof Discord.GuildMember ) return fsys.guildPath( baseObj.guild, subs );
		else if ( baseObj instanceof Discord.Guild ) return fsys.guildPath( baseObj, subs );

		return '';

	}

	/**
	 * 
	 * @param {string} key 
	 * @param {*} data 
	 */
	cacheKeyData( key, data ) {
		this._cache.cache( key, data );
	}

	/**
	 * 
	 * @param {GuildMember|User} uObject 
	 */
	async fetchUserData( uObject ){

		let objPath;
		if ( uObject instanceof Discord.GuildMember ) {
			objPath = fsys.memberPath( uObject );
		} else {
			objPath = fsys.getUserDir( uObject );
		}
		return this._cache.fetch( objPath );

	}

	/**
	 * 
	 * @param {Discord.User|Discord.GuildMember} uObject 
	 * @param {*} data - user data to store.
	 */
	async storeUserData( uObject, data ){

		let objPath;
		if ( uObject instanceof Discord.GuildMember ){
			objPath = fsys.memberPath( uObject );
	
		} else {
			objPath = fsys.getUserDir( uObject );
		}
		return this._cache.cache( objPath, data );

	}

	/**
	 * Finds and returns the named user in the channel,
	 * or replies with an error message.
	 * Function is intentionally not async since there is no reason
	 * to wait for the channel reply to go through.
	 * @param {Channel} channel 
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

	/**
	 * 
	 * @param {Channel} channel 
	 * @param {string} name
	 * @returns {GuildMember|User}
	 */
	findUser( channel, name ) {

		if ( !channel ) return null;

		name = name.toLowerCase();
		switch ( channel.type ) {

			case 'text':
			case 'voice':

				return channel.guild.members.find(

					gm =>
						gm.displayName.toLowerCase() === name || (
							gm.nickname && gm.nickname.toLowerCase() === name
						)
				);

			case 'dm':
				if ( channel.recipient.username.toLowerCase() === name ) return channel.recipient;
				return null;
			case 'group':

				for( let id of channel.nicks.keys() ) {
					if ( channel.nicks.get(id).toLowerCase() === name ) return channel.recipients.get(id);
				}
				return channel.recipients.find( u=>u.username.toLowerCase() === name );

		}

		return null;

	}

	async printCommand( chan, cmdname ) {

		let cmds = this._dispatch.commands;
		if ( cmds && cmds.hasOwnProperty( cmdname ) ) {

			let cmdInfo = cmds[cmdname];
			let usage = cmdInfo.usage;
			if ( !usage ) return chan.send( 'No usage information found for command \'' + cmdname + '\'.');
			else return chan.send( cmdname + ' usage: ' + cmdInfo.usage );


		} else return chan.send( 'Command \'' + cmdname + '\' not found.' );

	}

	async printCommands( chan ) {

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
		return chan.send( str );

	}

} // class

/**
 * 
 * @param {GuildMember} oldGM 
 * @param {GuildMember} newGM 
 */
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