const Discord = require('discord.js');
const fsys = require( './botfs.js');
const afs = require( './afs');

// base Context.
const Context = class {

	// 'guild', 'user', 'dm', 'group', 'channel'
	get type() { return 'unknown'; }

	// discord obj with id that serves as context base.
	get idObject() { return this._idobj; }
	get sourceID() { return this._idobj.id; }

	get bot() { return this._bot; }

	get cache() { return this._cache; }

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

		console.log( 'cache key: ' + this._cache.cacheKey );

	}

	illegalName( s) {

		let a = fsys.illegalChars;
		for( let i = a.length-1; i>=0; i--) {
			if ( s.indexOf( a[i]) >= 0) return true;
		}
		return false;

	}

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

		if ( obj instanceof Discord.Message ) {
			obj.reply( 'User \'' + user + '\' not found.');
		} else {
			obj.send( 'User \'' + user + '\' not found.');
		}
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

	async displayName( id ) {

		if ( !id ) return 'Invalid ID';

		try {
	
			let u = await this._bot.client.fetchUser( id );
			if ( u ) return u.username;
		} catch ( e) {}

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

	// add a context instance.
	addInstance( inst ) {
		this._instances[ inst.constructor.name ] = inst;
	}

	async routeCommand( cmd, args ) {

		let target = this._instances[ cmd.instClass.name ];
		if ( !target ) target = await this.addClass( cmd.instClass );
		if ( !target ) console.log( 'ERROR:Null Target' );

		cmd.func.apply( target, args );

	}

	/**
	 * Creates a context subcache mapped by key.
	 * @param {*} key
	 * @returns - The Cache object.
	 */
	subcache( key ) { return this._cache.makeSubCache(key); }

	/**
	 * 
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

	async deleteKeyData( key ) {
		await this._cache.delete(key);
	}

	/**
	 * Caches data without writing to disk.
	 * @param {string} key 
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
	
	// fetch data for abitrary key.
	async fetchKeyData( key ) { return await this._cache.fetch(key); }

	// associate data with key.
	async storeKeyData( key, data, forceSave=false ) {

		if ( forceSave ) this._cache.store( key, data );
		else this._cache.cache( key, data );

	}

}

exports.UserContext = class extends Context {

	get type() { return 'user'; }
	get name() { return this._idobj.username; }

	findUser( name ) {

		if ( this._idobj.username.toLowerCase() === name.toLowerCase() ) {
			return this._idobj;
		}
		return null;

	}

}

//GroupDMChannel
exports.GroupContext = class extends Context {

	get type() { return 'group'; }
	get name() { return this._idobj.name; }

	findUser( name ){
		name = name.toLowerCase();
		return this._idobj.nicks.find( val => val.toLowerCase() === name );
	}

}

exports.GuildContext = class extends Context {

	get type() { return 'guild'; }
	get name() { return this._idobj.name; }
	
	async displayName( id ) {

		if ( !id ) return 'Invalid ID';

		try {

			let g = await this._idobj.fetchMember( id );
			if ( g ) return g.displayName;

		} catch( e ) {}

		return 'Unknown User';

	}

	findUser( name ) {

		name = name.toLowerCase();
		return this._idobj.members.find( gm => gm.displayName.toLowerCase() === name );

	}

}