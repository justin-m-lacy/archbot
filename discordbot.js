const fsys = require( './botfs.js');
const cmd = require( './commands.js');
const cacher = require( './cache.js' );
const Discord = require ( 'discord.js');

const Context = exports.Context = require( './botcontext.js');

var Bot;
exports.InitBot = ( client, cmdPrefix='!') => {
	Bot = new DiscordBot( client, cmdPrefix );
	return Bot;
}
exports.GetBot = () => Bot;

class DiscordBot {

	get client() { return this._client;}
	get fsys() { return this._fsys; }
	get cache() { return this._cache; }
	get dispatch() { return this._dispatch;}
	get contexts() { return this._contexts;}
	get contextClasses() { return this._contextClasses; }

	constructor( client, cmdPrefix='!' ) {

		// map target discord obj to processing context.
		this._contexts = {};

		// classes to instantiate for each context.
		this._contextClasses = [];

		this._client = client;
		this._fsys = fsys;
		this._cache = new cacher.Cache( fsys.readData, fsys.writeData, fsys.fileExists );

		this._cmdPrefix = cmdPrefix;
		this._dispatch = new cmd.Dispatch( cmdPrefix );

		this.initClient();

	}

	addPlugins( plug_files ) {

		let plug;
		let init;
		let contClass;
		for( let i = plug_files.length-1; i >= 0; i-- ) {

			plug = plug_files[i];
			init = plug.init;
			if ( init != null && typeof(init) == 'function' ){
				plug.init( this );
			}
			contClass = plug.ContextClass;
			if ( contClass != null ) this.addContextClass( contClass );

		}

	}

	addContextClass( cls ) {

		this._contextClasses.push(cls);

		let context;
		for( let k in this._contexts ){

			context = this._contexts[k];
			context.addInstance( new cls(context ) );

		}

	}

	initClient() {

		// NOTE: 'this' for events is always client.
		this._client.on( 'ready', onReady );
		this._client.on( 'guildUnavailable', onGuildUnavail )

		this._client.on( 'resume', onResume );

		this._client.on( 'message', (m)=>{this.onMessage(m);} );

		this._client.on( 'presenceUpdate', onPresence );

	}

	onMessage( m ) {

		if ( m.author.id == this._client.user.id ) return;

		// get Context for cmd routing.
		let type = m.channel.type;
		let context;
		if ( type == 'text' || type == 'voice ') {
			context = this.getContext( m.guild, 'guild');
		} else if ( type == 'group' ) {
			context = this.getContext( m.channel, type )
		} else {
			// dm
			context = this.getContext( m.reciever, type );
		}

		try {
	
			let content = m.content;
	
			if ( content.substring(0,1) === this._cmdPrefix ) {

				let error = this._dispatch.routeCmd( context, m.content, [m] );
				if ( error ) m.channel.send( error );
				
			}
	
		} catch ( exp ) {
			console.error( exp );
		}

	}

	/**
	 * 
	 * @param {*} obj 
	 * @param {*} type 
	 */
	getContext( obj, type=null ) {

		let id = obj.id;
		if ( this._contexts.hasOwnProperty(id) ) {
			return this._contexts[id];
		}

		console.log( 'creating new context.' );
		let c = this._contexts[id] = new Context( this, obj, type );

		let cls;
		for( let i = this._contextClasses.length-1; i >= 0; i-- ) {

			cls = this._contextClasses[i];
			c.addInstance( new cls( c ) );

		}

		return c;

	}

	displayName( uObject ){
		if ( uObject instanceof Discord.GuildMember ){
			return uObject.displayName;
		} else {
			return uObject.username;
		}

	}

	getSender( msg ) {

		if ( msg.member != null ) return msg.member;
		return msg.author;

	}

	printCommand( chan, cmdname ) {

		let cmds = this._dispatch.commands;
		if ( cmds != null && cmds.hasOwnProperty( cmdname ) ) {

			let cmdInfo = cmds[cmdname];
			let desc;
			if ( cmdInfo.hasOwnProperty( 'usage')) {
				desc = cmdname + ' usage: ' + cmdInfo.usage;
			} else {
				desc = 'No usage information found for: ' + cmdname;
			}
			chan.send( desc );

		} else {
			chan.send( 'Command not found.');
		}

	}

	printCommands( chan ) {

		let str = 'Use help [cmd] for more information.\nAvailable commands:\n';
		let cmds = this._dispatch.commands;
		if ( cmds != null ) {

			let a = [];
			for( let k in cmds ){
				a.push(k);
			}

			str += a.join(', ');

		}
		chan.send( str );

	}

	// fetch data for abitrary key.
	async fetchKeyData( key ) {

		let data = await this._cache.get(key);
		if ( data ) data.key = key;
		return data;

	}

	// associate data with key.
	async storeKeyData( key, data ){
		await this._cache.store( key, data );
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
		if ( uObject instanceof Discord.GuildMember ){
			objPath = fsys.memberPath( uObject );
		} else {
			objPath = fsys.userPath( uObject );
		}
		let data = await this._cache.get( objPath );
		// save key for recaching.
		if ( data ) data.key = objPath;
		return data;
	}

	async storeUserData( uObject, data ){

		let objPath;
		if ( uObject instanceof Discord.GuildMember ){
			objPath = fsys.memberPath( uObject );
	
		} else {
			objPath = fsys.userPath( uObject );
		}
		await this._cache.store( objPath, data );

	}

	tryGetUser( channel, name ) {

		if ( name == null || name === '') {
			channel.send( 'User name expected.');
			return null;
		}
		let member = this.findUser( channel, name );
		if ( member == null ) channel.send( 'User ' + name + ' not found.' );
		return member;

	}

	findUser( channel, name ) {

		if ( channel == null ) return null;

		switch ( channel.type ) {

			case 'text':
			case 'voice':

				let user = channel.guild.members.find(
					gm=> gm.displayName.toLowerCase() === name.toLowerCase()
				);
				return user;

				break;
			case 'dm':
				name = name.toLowerCase();
				if ( channel.recipient.username.toLowerCase() === name ) return channel.recipient;
				return null;
				break;
			case 'group':
				return channel.nicks.find( val => val.toLowerCase() === name.toLowerCase() );
				break;

		}

	}

} // class

function onPresence( oldGM, newGM ) {

	if ( newGM.id == Bot.client.user.id ) {
		console.log( 'presence update for bot.');
		if ( newGame.presence.status == 'online'){
			console.log( 'bot now online in guild: ' + newGM.guild.name );
		}
	}
}

function onGuildUnavail( g ){
	console.log( 'guild unavailable: ' + g.name );
}

function onReady() {
	console.log( 'bot logged in as: ' + this.user.username );
}

function onResume( evtCount ) {
	console.log('resuming. missed ' + evtCount + ' events.');
}