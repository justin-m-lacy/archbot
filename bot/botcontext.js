const Discord = require('discord.js');
const fsys = require( './botfs.js');
const afs = require( '../afs');

const Access = require( './access.js' );

// base Context.
const Context = class {

	/**
	 * {string} 'guild', 'user', 'dm', 'group', 'channel'
	 */
	get type() { return 'unknown'; }

	// discord obj with id that serves as context base.
	get idObject() { return this._idobj; }
	get sourceID() { return this._idobj.id; }

	/**
	 * {DisordBot}
	 */
	get bot() { return this._bot; }

	get cache() { return this._cache; }

	/**
	 * {Access} - Information about access to settings and commands.
	 */
	get access() { return this._access; }
	set access(v) { this._access = v; }

	/**
	 * @param {discord object} idobj - guild, channel, or user
	 * that acts as the basis for the context.
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
	 * @param {Class[]} plugClasses
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
	 * @param {Message} m 
	 */
	async doBackup() {
		return await this._cache.backup( 0 );
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
	 * @param {Number|string} perm 
	 */
	setAccess( cmd, perm ) {
		this.access.setAccess( cmd, perm );
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
	 */
	canAccess( cmd, gm ) {
		return this._access.canAccess( cmd, gm );
	}

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
	 * 
	 * @param {string} key 
	 * @param {*} value 
	 */
	async setSetting( key, value=null ) {

		let settings = await this.cache.fetch( 'settings');
		if ( !settings ) {
			settings = {};
		}

		settings[key] = value;
		this.cache.cache( 'settings', value );

	}

	/**
	 * 
	 * @param {string} key 
	 */
	async getSetting( key ) {

		let settings = await this.cache.fetch( 'settings');

		if ( !settings || !settings.hasOwnProperty(key)) return undefined;
		return settings[key];

	}

	/**
	 * Tests if a file name or cache-key is illegal.
	 * @param {string} s 
	 */
	illegalName( s) {

		let a = fsys.illegalChars;
		for( let i = a.length-1; i>=0; i--) {
			if ( s.indexOf( a[i]) >= 0) return true;
		}
		return false;

	}

	/**
	 * Returns true if the given discord user is the bot owner.
	 * @param {Discord.User|string} u 
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
			if ( m.content.charAt(0) === this._bot.cmdPrefix) return;
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
	 * Returns a list of all files stored at the given data path.
	 * ( path is relative to this context's save directory. )
	 * File extensions are removed before returning.
	 * @param {string} path 
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
	showUserNotFound( obj, user ) {

		if ( obj instanceof Discord.Message ) obj.reply( 'User \'' + user + '\' not found.');
		else obj.send( 'User \'' + user + '\' not found.');

	}

	/**
	 * Attempts to find a user in the given Context. If a user
	 * is not found, an error message is displayed.
	 * @param {Discord.Channel|Discord.Message} resp 
	 * @param {string} name 
	 */
	userOrShowErr( resp, name ) {

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
	 * 
	 * @param {string} id - discord user id.
	 */
	async displayName( id ) {

		if ( !id ) return 'Invalid ID';
	
		let u = await this._bot.client.fetchUser( id );
		if ( u ) return u.username;

		return 'Unknown User';

	}

	/**
	 * Returns a name to display for the given user.
	 * @param {string|Discord.User|Discord.GuildMember} o 
	 */
	userString( o ) {

		if ( typeof(o) === 'string') return o;
		if ( o instanceof Discord.User ) return o.username;
		if ( o instanceof Discord.GuildMember ) return o.displayName;
		return o.id;
	}

	/**
	 * Override in botcontext subclasses to find named user within context.
	 * @param {string} name 
	 */
	findUser( name ) { return null; }

	/**
	 * Adds a class to be instantiated for the given context,
	 * if an instance does not already exists.
	 * @param {class} cls
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
	 * 
	 * @param {Command} cmd 
	 * @param {Array} args 
	 */
	async routeCommand( cmd, args ) {

		console.time( cmd.name );

		let target = this._instances[ cmd.instClass.name ];
		if ( !target ) target = await this.addClass( cmd.instClass );
		if ( !target ) console.log( 'ERROR:Null Target' );

		cmd.func.apply( target, args );

		console.timeEnd( cmd.name );

	}

	/**
	 * Creates a context subcache mapped by key.
	 * @param {*} key
	 * @returns - The Cache object.
	 */
	subcache( key ) { return this._cache.makeSubCache(key); }

	/**
	 * Returns the key which should be used to refer to a data path in the cache.
	 * @param {*} objs - objs are idables or cache path strings.
	 */
	getDataKey( ...objs ) {

		let len = objs.length;
		let keys = [];
		let pt;
		for( let i = 0; i < len; i++ ){
	
			pt = objs[i];
			if ( typeof(pt) === 'string') keys.push(pt);
			else keys.push(pt.id);

		}
		return keys.join( '/' );

	}

	/**
	 * 
	 * @param {*} key 
	 */
	async deleteKeyData( key ) {
		await this._cache.delete(key);
	}

	/**
	 * Caches data without writing to disk.
	 * @param {*} key 
	 * @param {*} data 
	 */
	cacheKeyData( key, data ) {
		this._cache.cache(key, data );
	}

	/**
	 * Attempts to retrieve data from cache without
	 * checking backing store.
	 * @param {*} key 
	 */
	getKeyData( key ) { return this._cache.get(key); }
	
	/**
	 * Fetch keyed data.
	 * @param {*} key 
	 */
	async fetchKeyData( key ) { return await this._cache.fetch(key); }

	/**
	 * Set keyed data.
	 * @param {*} key 
	 * @param {*} data 
	 * @param {Boolean} [forceSave=false] Whether to force a save to the underlying data store. 
	 */
	async storeKeyData( key, data, forceSave=false ) {

		if ( forceSave ) this._cache.store( key, data );
		else this._cache.cache( key, data );

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

	/**
	 * 
	 * @param {string} name - GuildMember display name of user to find.
	 */
	findUser( name ) {

		name = name.toLowerCase();
		return this._idobj.members.find( gm => gm.displayName.toLowerCase() === name );

	}

}