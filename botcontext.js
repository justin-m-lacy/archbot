const Discord = require('discord.js');
const fsys = require( './botfs.js');
const afs = require( './async_fs');

// base Context.
const Context = class {

	// 'guild', 'user', 'dm', 'group', 'channel'
	get type() { return 'unknown'; }

	// discord obj with id that serves as context base.
	get idObject() { return this._idobj; }

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

	/**
	 * Register an event with the underlying Discord client.
	 * @param {string} evtName 
	 * @param {function} func 
	 */
	onEvent( evtName, func ) {
		this._bot.client.on( evtName, func );
	}

	/**
	 * Returns a list of all files stored at the given
	 * data path.
	 * ( path is relative to this context's save directory. )
	 * @param {string} path 
	 */
	async getDataList( path ) {
		return await afs.readdir( this._cache.cacheKey + path );
	}

	/**
	 * Displays standard user not found message to the given
	 * channel.
	 * @param {Discord.Channel} chan 
	 * @param {string|number} user 
	 */
	showUserNotFound( chan, user ) {
		chan.send( 'User \'' + user + '\' not found.');
	}

	userOrShowErr( chan, name ) {

		if ( name == null || name === '') {
			chan.send( 'User name expected.');
			return null;
		}
		let member = this.findUser( name );
		if ( member == null ) chan.send( 'User \'' + name + '\' not found.' );
		return member;

	}

	/**
	 * Returns a name to display for the given user.
	 * @param {string|Discord.User|Discord.GuildMember} o 
	 */
	userString( o ) {

		if ( typeof(o) == 'string') return o;
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
	addClass( cls ) {

		if ( this._instances[cls.name] != null ) return;

		let inst = new cls( this );
		this._instances[ cls.name ] = inst;
		return inst;

	}

	// add a context instance.
	addInstance( inst ) {
		this._instances[ inst.constructor.name ] = inst;
	}

	routeCommand( cmd, args ) {

		let target = this._instances[ cmd.instClass.name ];
		if ( target == null ) target = this.addClass( cmd.instClass );
	
		cmd.func.apply( target, args );

	}

	// objs are idables or path strings.
	getDataKey( ...objs ) {

		let len = objs.length;
		let keys = [];
		let pt;
		for( let i = 0; i < len; i++ ){
	
			pt = objs[i];
			if ( typeof(pt) === 'string')keys.push(pt);
			else keys.push(pt.id);

		}
		return keys.join( '/' );

	}

	// fetch data for abitrary key.
	async fetchKeyData( key ) {

		let data = await this._cache.get(key);
		if ( data ) data.key = key;
		return data;
	
	}
	
	// associate data with key.
	async storeKeyData( key, data ) {
		await this._cache.store( key, data );
	}

}

exports.UserContext = class extends Context {

	get type() { return 'user'; }
	get name() { return this._idobj.username; }

	findUser( name ) {

		if ( this._idobj.username.toLowerCase() == name.toLowerCase() ) {
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
		return this._idobj.nicks.find( val => val.toLowerCase() === name.toLowerCase() );
	}

}

exports.GuildContext = class extends Context {

	get type() { return 'guild'; }
	get name() { return this._idobj.name; }

	findUser( name ) {

		return this._idobj.members.find(
			gm => gm.displayName.toLowerCase() === name.toLowerCase()
		);

	}

}