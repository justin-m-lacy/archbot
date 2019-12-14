const fsys = require( './botfs.js');
const Dispatch = require( './dispatch.js');
const Cache = require( 'archcache' );
const Discord = require ( 'discord.js');
const path = require( 'path' );

/**
 * @constant {number} CONTENT_MAX - maximum message size.
 */
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

	/**
	 * @property {DiscordClient}
	 */
	get client() { return this._client;}

	/**
	 * @property {Cache}
	 */
	get cache() { return this._cache; }

	/**
	 * @property {Dispatch}
	 */
	get dispatch() { return this._dispatch;}

	/**
	 * @property {Object[string->BotContext]}
	 */
	get contexts() { return this._contexts;}

	/**
	 * @property {object[]} plugin classes to instantiate for each context.
	 */
	get contextClasses() { return this._contextClasses; }

	/**
	 * @property {string}
	 */
	get cmdPrefix() { return this._cmdPrefix; }

	/**
	 * @property {string} the working directory of the program. defaults to the directory of the main script file.
	 */
	get directory() { return this._directory; }

	/**
	 * @property {string} base save directory.
	 */
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

		this._cache = new Cache({

			loader:fsys.readData,
			saver:fsys.writeData,
			checker:fsys.fileExists,
			deleter:fsys.deleteData

		});

		this._dispatch = new Dispatch( this._cmdPrefix );

		// maps id->context id.
		this.restoreProxies();

		this.loadPlugins();

		this._master = masterid;

		process.on( 'exit', ()=>this.onShutdown() );
		process.on( 'SIGINT', ()=>this.onShutdown() );

		client.setInterval(
			()=>{

				try {
					this._cache.cleanup(60*1000*30);
				} catch(e){console.error(e); }

			}, 60*1000*30 );

		client.setInterval(
			()=>{
				try {
					this._cache.backup(60*1000*15);
				} catch(e) { console.error(e); }
			}, 60*1000*15 );

		this.initClient();

		this.addCmd( 'backup', 'backup', (m)=>this.cmdBackup(m),
		{ access:0, access:Discord.Permissions.FLAGS.ADMINISTRATOR, immutable:true, module:'default' } );
		this.addCmd( 'archleave', 'archleave', (m)=>this.cmdLeaveGuild(m), {
			access:Discord.Permissions.FLAGS.ADMINISTRATOR
		} );
		this.addCmd( 'archkill', 'archkill', m=>this.cmdBotQuit(m), { immutable:true} );
		this.addCmd( 'proxyme', 'proxyme', (m)=>this.cmdProxy(m) );
		this.addCmd( 'access', 'access cmd [permissions|roles]',
			(m, cmd, perm)=>this.cmdAccess(m, cmd, perm),
			{ minArgs:1, access:Discord.Permissions.FLAGS.ADMINISTRATOR, immutable:true }
		);
		this.addCmd( 'resetaccess', 'resetaccess cmd',
			(m,cmd)=>this.cmdResetAccess(m,cmd),
			{minArgs:1, maxArgs:1, access:Discord.Permissions.FLAGS.ADMINISTRATOR}
		);

	}

	/**
	 * Attempt to load config file.
	 */
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

	/**
	 * Attempt to load plugins.
	 */
	loadPlugins(){

		if ( !this._plugsdir) return;

		try {

			var plugins = require( '../plugsupport.js' ).loadPlugins( this._plugsdir );
			this.addPlugins( plugins );

		} catch(e) { console.error(e);}
	}

	/**
	 * @async
	 */
	async onShutdown() {
		if ( this._client ) {
			await this._cache.backup();
			this._client.destroy();
			this._client = null;

		}
		process.exit(1);
	}

	/**
	 *
	 * @param {Object[]} plug_files
	 */
	addPlugins( plug_files ) {

		let plug, init;
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

		this._client.on( 'message', m=>this.onMessage(m) );

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

	/**
	 * Add a command to the bot.
	 * @param {string} name
	 * @param {string} desc
	 * @param {Function} func
	 * @param {?Object} [opts=null]
	 */
	addCmd( name, desc, func, opts=null ) {
		this._dispatch.add( name, desc, func, opts );
	}

	/**
	 * Add a command with a plugin class which is instantiated for each chat context.
	 * @param {string} name
	 * @param {string} desc
	 * @param {Function} func
	 * @param {Object} plugClass
	 * @param {?Object} [opts=null]
	 */
	addContextCmd( name, desc, func, plugClass, opts=null ) {
		this._dispatch.addContextCmd( name, desc, func, plugClass, opts );
	}

	/**
	 *
	 * @param {Message} m
	 */
	async onMessage( m ) {

		if ( m.author.id === this._client.user.id ) return;
		if ( this.spamcheck(m) ) return;

		let command = this._dispatch.parseLine( m.content );

		if ( !command ) return;

		// check command access.

		let context = await this.getMsgContext( m );
		if ( context ) {
			if ( m.member && this.testAccess(m, command, context ) === false ) return this.sendNoPerm( m, command );
		}

		if ( command.isDirect === true ) {

			this._dispatch.dispatch( command, [m] );

		} else if ( context ) {

			// context command.
			let error = this._dispatch.routeCmd( context, command, [m] );

			if ( !error ) return;
			else if ( error instanceof Promise ) {

				error.then( s=> { if ( s) return m.channel.send(s); } ).catch(e=>console.error(e) );

			} else if ( typeof(error) === 'string' ) {

				return m.channel.send( error );

			}

		}

	}

	/**
	 *
	 * @param {Message} m
	 * @param {Command} cmd
	 * @param {*} context
	 * @returns {boolean}
	 */
	testAccess( m, cmd, context ) {

		let allowed = context.canAccess( cmd.name, m.member );
		if ( allowed === undefined ) {

			// check default access.
			if ( !cmd.access) return true;
			return m.member.permissions.has( cmd.access );

		}

		return allowed;

	}

	/**
	 * Returns true if the given discord user is the bot owner.
	 * @param {Discord.User|string} u
	 * @returns {boolean}
	 */
	isMaster( u ) {

		if ( u instanceof Discord.User ) return u.id === this._master;
		return u === this._master;
	}

	/**
	 * Backup unsaved cache items.
	 * @async
	 * @param {Message} m
	 * @returns {Promise}
	 */
	async cmdBackup( m ) {

		if ( this.isMaster( m.author.id ) ) {
			await this._cache.backup( 0 );
		} else {

			let context = this.getMsgContext( m );
			if ( context ) await this.context.doBackup();
		}
		return m.reply( 'backup complete.');

	}

	/**
	 * Close the running Archbot program. Owner only.
	 * @async
	 * @param {Message} m
	 * @returns {Promise}
	 */
	async cmdBotQuit(m) {

		if ( this.isMaster(m.author.id) ) {
			this.client.destroy();
		}
		return this.sendNoPerm(m);

	}

	/**
	 * Make Archbot leave the current guild.
	 * @async
	 * @param {Message} m
	 * @returns {Promise}
	 */
	async cmdLeaveGuild( m ) {

		if ( this.isMaster( m.author.id ) && m.guild ) {
			return m.guild.leave();
		}
		return this.sendNoPerm(m);

	}

	/**
	 *
	 * @param {Message} m
	 * @returns {boolean} returns true to block guild/channel.
	 */
	spamcheck(m) {

		if ( !m.guild) return false;
		let allow = this._spamblock[m.guild.id];
		if ( !allow ) return false;
		if ( allow[m.channel.id]) return false;
		return true;

	}

	/**
	 * Proxy the given context through the user's DM.
	 * @async
	 * @param {Message} m
	 * @returns {Promise}
	 */
	async cmdProxy( m ) {

		// get context of the guild/channel to be proxied to user.
		let context = await this.getMsgContext(m);

		this.setProxy( m.author, context );
		return m.author.send( 'Proxy created.');

	}

	/**
	 * Reset command's permissions to default.
	 * @async
	 * @param {Message} m
	 * @param {string} cmd - name of command.
	 * @returns {Promise}
	 */
	async cmdResetAccess( m, cmd ) {

		// unset any custom access.
		context.unsetAccess( cmd );
		return m.reply('Access reset.');

	}

	/**
	 * @async
	 * @param {Message} m
	 * @param {string} cmdName - name of command.
	 * @param {string} [perm=undefined]
	 * @returns {Promise}
	 */
	async cmdAccess( m, cmdName, perm=undefined ) {

		let cmd = this._dispatch.getCommand( cmdName );
		if ( !cmd ) return m.reply( `Command '${cmdName}' not found.` );
		else if ( cmd.immutable ) return m.reply( `The access level of Command '${cmdName}' is immutable.`);

		let context = await this.getMsgContext( m );
		if ( perm === undefined || perm === null ) {

			let info = context.accessInfo(cmdName );
			if ( !info && info !== 0 && info !== '0' ) {

				// return default command access.
				if ( !cmd.access) return m.reply('Anyone can use this command.');
				return m.reply( `Access for ${cmdName}: ${cmd.access}`);

			} else {

				return m.reply(`Access for ${cmdName}: ${info}` );

			}

		} else {

			context.setAccess( cmdName, perm );
			return m.reply('Access set.');

		}

	}

	/**
	 * Send a no-permission message.
	 * @async
	 * @param {Message} m
	 * @param {Command} [cmd=null]
	 * @returns {Promise}
	 */
	async sendNoPerm( m, cmd=null ) {

		if ( cmd ) return m.reply( 'You do not have permission to use the command `${cmd.name}`');
		return m.reply( 'You do not have permission to use that command.');

	}

	/**
	 * Proxy a Context to a user's PM.
	 * @param {User} user
	 * @param {BotContext} context
	 */
	setProxy( user, context ) {

		this._contexts[user.id] = context;
		this._proxies[ user.id ] = context.sourceID;
		this.cacheData( 'proxies', this._proxies );

	}

	/**
	 * Save information about proxied contexts.
	 * @async
	 * @returns {Promise<*>}
	 */
	async saveProxies() {
		return this.storeData( 'proxies', this._proxies );
	}

	/**
	 * Restore proxies defined in proxies file.
	 * @async
	 * @returns {Promise}
	 */
	async restoreProxies() {

		this._proxies = {};
		let loaded = await this.fetchData( 'proxies' );
		if ( loaded ) {
			this._proxies = Object.assign( this._proxies, loaded );
		}

	}

	/**
	 * Return a Context associated with the message channel.
	 * @async
	 * @param {Discord.Message} m
	 * @returns {Promise<BotContext>}
	 */
	async getMsgContext( m ) {

		let type = m.channel.type, idobj;

		if ( type === 'text' || type === 'voice ') idobj = m.guild;
		else if ( type === 'group' ) {

			idobj = m.channel;
			if ( this._proxies[idobj.id] ) return this.getProxy( idobj, this._proxies[idobj.id] );

		} else {

			idobj = m.author;
			//check proxy
			if ( this._proxies[idobj.id] ) return this.getProxy( idobj, this._proxies[idobj.id] );

		}

		return this._contexts[ idobj.id ] || this.makeContext( idobj, type );

	}

	/**
	 * @async
	 * @param {*} idobj
	 * @param {string} type
	 * @returns {Promise<BotContext>}
	 */
	async getContext( idobj, type ) {

		let proxid = this._proxies[idobj.id];
		if ( proxid ) return this.getProxy( idobj, proxid );

		return this._contexts[idobj.id] || this.makeContext( idobj, type );

	}

	/**
	 * Get a context from the source id, mapping messages
	 * to the destobj.
	 * @async
	 * @param {*} destobj
	 * @param {*} srcid
	 * @returns {Promise<BotContext>}
	 */
	async getProxy( destobj, srcid ) {

		let con = this._contexts[srcid];
		if ( con ) return con;

		let proxob = this.findProxTarget( srcid );
		if ( proxob) return this.makeContext( proxob );

		// proxy not found.
		console.log( 'ERROR: Proxy not found: ' + srcid );
		return this._contexts[destobj.id] || this.makeContext( destobj );

	}

	/**
	 * Get the object associated with a Discord id.
	 * @param {string} id
	 * @returns {Guild|Channel}
	 */
	findProxTarget( id ) {
		return this._client.guilds.get(id) || this.client.channels.get(id);
	}

	/**
	 * @async
	 * @param {*} idobj
	 * @param {*} type
	 * @returns {Promise<BotContext>}
	 */
	async makeContext( idobj, type ) {

		console.log( 'creating context for: ' + idobj.id );
		let context;

		if ( type === 'text' || !type || type === 'voice' )
			context = new Contexts.GuildContext( this, idobj, this._cache.subcache( fsys.getGuildDir(idobj) ) );
		else if ( type === 'group' )
			context = new Contexts.GroupContext( this, idobj, this._cache.subcache( fsys.getChannelDir(idobj) ) );
		else  context = new Contexts.UserContext( this, idobj, this._cache.subcache( fsys.getUserDir(idobj)) );

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

	/**
	 * fetch data for arbitrary key.
	 * @async
	 * @param {string} key
	 * @returns {Promise<*>}
	 */
	async fetchData( key ) {
		return this._cache.fetch(key);
	}

	/**
	 * Store data for key.
	 * @async
	 * @param {string} key
	 * @param {*} data
	 * @returns {Promise}
	 */
	async storeData( key, data ){
		return this._cache.store( key, data );
	}

	/**
	 * Create a key to associate with a chain of Discord objects.
	 * @param {*} baseObj
	 * @param  {...any} subs
	 * @returns {string}
	 */
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
	cacheData( key, data ) {
		this._cache.cache( key, data );
	}

	/**
	 * @async
	 * @param {GuildMember|User} uObject
	 * @returns {Promise<*>}
	 */
	async fetchUserData( uObject ){

		let objPath = ( uObject instanceof Discord.GuildMember ) ? fsys.memberPath( uObject )
			: objPath = fsys.getUserDir( uObject );

		return this._cache.fetch( objPath );

	}

	/**
	 *
	 * @param {Discord.User|Discord.GuildMember} uObject
	 * @param {*} data - user data to store.
	 */
	storeUserData( uObject, data ){

		let objPath = ( uObject instanceof Discord.GuildMember ) ? fsys.memberPath( uObject ) :
			fsys.getUserDir( uObject );

		return this._cache.cache( objPath, data );

	}

	/**
	 * Finds and returns the named user in the channel,
	 * or replies with an error message.
	 * Function is intentionally not async since there is no reason
	 * to wait for the channel reply to go through.
	 * @param {Channel} channel
	 * @param {string} name
	 * @returns {}
	 */
	userOrSendErr( channel, name ) {

		if ( !name ) {
			channel.send( 'User name expected.');
			return null;
		}
		let member = this.findUser( channel, name );
		if ( !member ) channel.send( 'User \'' + name + '\' not found.');
		return member;

	}

	/**
	 * Find a GuildMember or User object in the channel.
	 * @param {Discord.Channel} channel
	 * @param {string} name - name or nickname of user to find.
	 * @returns {(GuildMember|User|null)}
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

	/**
	 * @async
	 * @param {Channel} chan
	 * @param {string} cmdname
	 * @returns {Promise}
	 */
	async printCommand( chan, cmdname ) {

		let cmds = this._dispatch.commands;
		if ( cmds && cmds.hasOwnProperty( cmdname ) ) {

			let cmdInfo = cmds[cmdname];
			let usage = cmdInfo.usage;
			if ( !usage ) return chan.send( 'No usage information found for command \'' + cmdname + '\'.');
			else return chan.send( cmdname + ' usage: ' + cmdInfo.usage );


		} else return chan.send( 'Command \'' + cmdname + '\' not found.' );

	}

	/**
	 * Lists the commands associated with a given plugin or module.
	 * @async
	 * @param {string} module
	 * @returns {Promise}
	 */
	async moduleCommands( module ) {
	}

	/**
	 * @async
	 * @param {Channel} chan
	 * @returns {Promise}
	 */
	async printCommands( chan ) {

		let str = `Use ${this.cmdPrefix}help [command] for more information.\nAvailable commands:\n`;
		let cmds = this._dispatch.commands;

		if ( cmds ) {

			let a = [];
			let sep = ': ' + this._dispatch.prefix;

			//let info;
			for( let k in cmds ) {

				if ( !cmds[k].hidden ) a.push( k + sep + cmds[k].desc );

			} //

			str += a.join('\n');

		}
		return chan.send( str, { split:{
			prepend:'Help cont...\n'
		}} );

	}

} // class

/**
 *
 * @param {GuildMember} oldGM
 * @param {GuildMember} newGM
 */
function onPresence( oldGM, newGM ) {

	if ( newGM.id === Bot.client.user.id ) {
		if ( newGame.presence.status === 'online'){
			console.log( 'bot now online in guild: ' + newGM.guild.name );
		}
	}
}

function onGuildUnavail( g ) {
	console.log( 'guild unavailable: ' + g.name );
}

function onResume( evtCount ) {
	console.log('resuming. missed ' + evtCount + ' events.');
}

/*function onReady() {
	console.log( 'bot logged in as: ' + this.user.username );
}*/