const Discord = require('discord.js');
const fsys = require( './botfs.js');
const afs = require( '../afs');

const Access = require( './access.js' );

/**
 * Base class for a BotContext.
 */
const Context = class {

	/**
	 * @property {string} type - 'guild', 'user', 'dm', 'group', 'channel'
	 */
	get type() { return 'unknown'; }

	/**
	 *
	 * @property {object} idObject - discord obj whose id serves as context base.
	 */
	get idObject() { return this._idobj; }

	/**
	 * @property {string} sourceID - id of the discord object associated with this context.
	 */
	get sourceID() { return this._idobj.id; }

	/**
	 * @property {DisordBot} bot
	 */
	get bot() { return this._bot; }

	/**
	 * @property {Cache} cache
	 */
	get cache() { return this._cache; }

	/**
	 * @property {Access} access - Information about access to settings and commands.
	 */
	get access() { return this._access; }
	set access(v) { this._access = v; }

	get afs() { return afs; }
	get botfs() { return fsys; }

	/**
	 * @param {DiscordBot} bot
	 * @param {discord object} idobj - guild, channel, or user
	 * that acts as the basis for the context.
	 * @param {Cache} cache
	 */
	constructor( bot, idobj, cache ) {

		this._idobj = idobj;
		this._bot = bot;

		// context instances.
		// _instances[class name] = class instance;
		this._instances = {};

		this._cache = cache;

		//console.log( 'cache key: ' + this._cache.cacheKey );

	}

	/**
	 * Load Context preferences, init Context classes required
	 * by plugins.
	 * @async
	 * @param {Class[]} plugClasses
	 * @returns {Promise}
	 */
	async init( plugClasses ) {

		for( let i = plugClasses.length-1; i >= 0; i-- ) {
			this.addClass( plugClasses[i]);
		}

		let roomPerms = await this.cache.fetch( 'access');
		this.access = new Access( roomPerms );

	}

	/**
	 * Backup the Context's cache.
	 * @async
	 * @param {Message} m
	 * @returns {Promise}
	 */
	async doBackup() {
		return this._cache.backup( 0 );
	}

	/**
	 * Return access permission string for the given command.
	 * @param {string} cmd
	 * @returns {string}
	 */
	accessInfo(cmd) {
		return this.access.accessInfo(cmd);
	}

	/**
	 *
	 * @param {string} cmd
	 */
	unsetAccess( cmd ) {
		this.access.unsetAccess( cmd );
	}

	/**
	 *
	 * @param {string} cmd
	 * @param {number|string} perm
	 * @returns {boolean}
	 */
	setAccess( cmd, perm ) {
		return this.access.setAccess( cmd, perm );
	}

	/**
	 *
	 * @param {string} cmd
	 */
	getAccess( cmd ) {
		return this.access.getAccess( cmd );
	}

	/**
	 *
	 * @param {string} cmd
	 * @param {GuildMember} gm
	 * @returns {boolean}
	 */
	canAccess( cmd, gm ) {
		return this._access.canAccess( cmd, gm );
	}

	/**
	 * Save this context's command permissions.
	 * @async
	 * @returns {Promise}
	 */
	async savePerms() {
		await this.cache.store( 'access', this.access );
	}

	/**
	 * Cache access without forcing write to disk.
	 */
	cachePerms() {
		this.cache.cache( 'access', this.access );
	}

	/**
	 * @async
	 * @param {string} key
	 * @param {*} value
	 * @returns {Promise<*>}
	 */
	async setSetting( key, value=null ) {

		let settings = await this.cache.fetch( 'settings');
		if ( !settings ) settings = {};

		settings[key] = value;
		this.cache.cache( 'settings', value );

	}

	/**
	 * @async
	 * @param {string} key
	 * @param {string} defaultset - value to return if setting not found.
	 * @returns {Promise<*|undefined>}
	 */
	async getSetting( key, defaultset=undefined ) {

		let settings = await this.cache.fetch( 'settings');

		if ( !settings || !settings.hasOwnProperty(key)) return defaultset;
		return settings[key];

	}

	/**
	 * Tests if a file name or cache-key is illegal.
	 * @param {string} s
	 * @returns {boolean}
	 */
	isValidKey( s) {

		let a = fsys.illegalChars;
		for( let i = a.length-1; i>=0; i--) {
			if ( s.indexOf( a[i]) >= 0) return false;
		}
		return true;

	}

	/**
	 * Check if Discord User is the bot owner.
	 * @param {Discord.User|string} u
	 * @returns {boolean}
	*/
	isMaster( u) { return this._bot.isMaster(u); }

	/**
	 * Register message event with Discord client.
	 * @param {string} evtName
	 * @param {function} func
	 */
	onMsg( func ) {

		this._bot.client.on( 'message', (m)=>{

			if ( m.author.id === m.client.user.id ) return;
			if ( m.content.charAt(0) === this._bot.cmdPrefix) return;	// ignore bot commands.
			if ( this._bot.spamcheck(m)) return;

			let t = this.type;
			if ( t === 'guild' ){
				if ( !m.guild || m.guild.id !== this._idobj.id) return;
			} else if ( t === 'group' || t === 'channel') {
				if ( m.channel.id !== this._idobj.id) return;
			} else if ( t === 'user' ) {
				if ( m.author.id !== this._idobj.id ) return;
			}

			func(m);

		} );
	}

	/**
	 * Returns an array of all files stored at a data path.
	 * ( path is relative to the context's save directory. )
	 * File extensions are not included.
	 * @async
	 * @param {string} path
	 * @returns {Promise<string[]>}
	 */
	async getDataList( path ) {

		let files = await afs.readfiles( fsys.BASE_DIR + this._cache.cacheKey + path );
		for( let i = files.length-1; i >= 0; i-- ) {

			var f = files[i].replace( /.[^/.]+$/, '' );
			files[i] = f;

		}

		return files;

	}

	/**
	 * Displays standard user not found message to the given
	 * channel.
	 * @param {Discord.Channel|Discord.Message} obj
	 * @param {string} user
	 */
	sendUserNotFound( obj, user ) {

		if ( obj instanceof Discord.Message ) return obj.reply( 'User \'' + user + '\' not found.');
		else return obj.send( 'User \'' + user + '\' not found.');

	}

	/**
	 * Attempts to find a user in the given Context.
	 * An error message is sent on failure.
	 * @param {Discord.Channel|Discord.Message} resp
	 * @param {string} name
	 * @returns {GuildMember|null}
	 */
	userOrSendErr( resp, name ) {

		if ( !name ) {
			( resp instanceof Discord.Channel ) ? resp.send( 'User name expected.') : resp.reply( 'User name expected.' );
			return null;
		}
		let member = this.findUser( name );
		if ( !member ) {
			( resp instanceof Discord.Channel ) ? resp.send( 'User \'' + name + '\' not found.' ) :
			resp.reply( 'User \'' + name + '\' not found.' )
		}

		return member;

	}

	/**
	 * @async
	 * @param {string} id - discord user id.
	 * @return {Promise<string>}
	 */
	async displayName( id ) {

		if ( !id ) return 'Invalid ID';

		let u = await this._bot.client.fetchUser( id );

		// todo: return null instead.
		return u ? u.username : 'Unknown User';

	}

	/**
	 * Returns a name to display for the given user.
	 * @param {(string|Discord.User|Discord.GuildMember)} o
	 * @returns {string}
	 */
	userString( o ) {

		if ( typeof o === 'string') return o;
		if ( o instanceof Discord.User ) return o.username;
		if ( o instanceof Discord.GuildMember ) return o.displayName;
		return o.id;
	}

	/**
	 * Override in botcontext subclasses to find named user within context.
	 * @param {string} name
	 * @returns {null} overridden in subclasses.
	 */
	findUser( name ) { return null; }

	/**
	 * Override in subclass.
	 * @param {string} name
	 */
	findChannel( name ) { return null; }

	/**
	 * Adds a class to be instantiated for the given context,
	 * if an instance does not already exists.
	 * @async
	 * @param {class} cls
	 * @returns {Promise<Object>}
	 */
	async addClass( cls ) {

		console.log( 'adding class: ' + cls.name );

		if ( this._instances[cls.name] ) {
			console.log('class exists');
			return this._instances[cls.name];
		}

		let inst = new cls( this );

		if ( inst.load ) await inst.load();

		this._instances[ cls.name ] = inst;

		return inst;

	}


	/**
	 * Add a context instance.
	 * @param {Object} inst - plugin instance for this context.
	 */
	addInstance( inst ) {
		this._instances[ inst.constructor.name ] = inst;
	}

	/**
	 * @async
	 * @param {Command} cmd
	 * @param {Array} args
	 * @returns {Promise}
	 */
	async routeCommand( cmd, args ) {

		//console.time( cmd.name );

		let target = this._instances[ cmd.instClass.name ];
		if ( !target ) {
			target = await this.addClass( cmd.instClass );
			if ( !target ) console.log( 'ERROR:Null Target' );
		}

		cmd.func.apply( target, args );

		//console.timeEnd( cmd.name );

	}

	/**
	 * Creates a context subcache mapped by key.
	 * @param {string} key
	 * @returns {Cache} - The Cache object.
	 */
	subcache( key ) { return this._cache.subcache(key); }

	/**
	 * Returns the key which should be used to refer to a data path in the cache.
	 * @param {*[]} objs - objs are idables or cache path strings.
	 * @returns {string}
	 */
	getDataKey( ...objs ) {

		let len = objs.length;
		let keys = [];
		let pt;
		for( let i = 0; i < len; i++ ){

			pt = objs[i];
			if ( typeof pt  === 'string') keys.push(pt);
			else keys.push(pt.id);

		}
		// todo: maybe use path.resolve instead?
		return keys.join( '/' );

	}

	/**
	 * @async
	 * @param {string} key
	 * @returns {Promise}
	 */
	async deleteData( key ) {
		return this._cache.delete(key);
	}

	/**
	 * Caches data without writing to disk.
	 * @param {string} key
	 * @param {*} data
	 */
	cacheData( key, data ) {
		this._cache.cache(key, data );
	}

	/**
	 * Attempts to retrieve data from cache without
	 * checking backing store.
	 * @param {string} key
	 * @returns {*}
	 */
	getData( key ) { return this._cache.get(key); }

	/**
	 * Fetch keyed data.
	 * @async
	 * @param {string} key
	 * @returns {Promise<*>}
	 */
	async fetchData( key ) { return this._cache.fetch(key); }

	/**
	 * Set keyed data.
	 * @async
	 * @param {string} key
	 * @param {*} data
	 * @param {boolean} [forceSave=false] Whether to force a save to the underlying data store.
	 * @returns {Promise}
	 */
	async storeData( key, data, forceSave=false ) {

		if ( forceSave ) return this._cache.store( key, data );
		else return this._cache.cache( key, data );

	}

}

exports.UserContext = class extends Context {

	/**
	 * {string}
	 */
	get type() { return 'user'; }

	/**
	 * {string}
	 */
	get name() { return this._idobj.username; }

	/**
	 *
	 * @param {string} name
	 */
	findUser( name ) {

		if ( this._idobj.username.toLowerCase() === name.toLowerCase() ) {
			return this._idobj;
		}
		return null;

	}

}

//GroupDMChannel
exports.GroupContext = class extends Context {
	/**
	 * {string}
	 */
	get type() { return 'group'; }
	/**
	 * {string}
	 */
	get name() { return this._idobj.name; }

	/**
	 *
	 * @param {string} name
	 * @returns {}
	 */
	findUser( name ){
		name = name.toLowerCase();
		return this._idobj.nicks.find( val => val.toLowerCase() === name );
	}

}

exports.GuildContext = class extends Context {
	/**
	 * {string}
	 */
	get type() { return 'guild'; }
	/**
	 * {string}
	 */
	get name() { return this._idobj.name; }

	/**
	 *
	 * @param {string} id
	 */
	async displayName( id ) {

		if ( !id ) return 'Invalid ID';

		try {

			let g = await this._idobj.fetchMember( id );
			if ( g ) return g.displayName;

		} catch( e ) {}

		return 'Unknown User';

	}

	findChannel( name ) {

		name = name.toLowerCase();
		return this.idObject.channels.find( c=> c.name.toLowerCase() === name );
	}

	/**
	 *
	 * @param {string} name - GuildMember display name of user to find.
	 */
	findUser( name ) {

		name = name.toLowerCase();
		return this._idobj.members.find( gm => gm.displayName.toLowerCase() === name );

	}

}