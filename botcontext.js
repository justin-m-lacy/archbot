const Discord = require('discord.js');
const fsys = require( './botfs.js');

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
	constructor( bot, idobj ) {

		this._idobj = idobj;
		this._bot = bot;

		// plugin instances running.
		this._instances = [];

		// routed commands.
		this._cmdRoutes = {};

		this._cache = bot.cache.makeSubCache( idobj.id );

	}

	tryGetUser( chan, name ) {

		if ( name == null || name === '') {
			chan.send( 'User name expected.');
			return null;
		}
		let member = this.findUser( name );
		if ( member == null ) chan.send( 'User ' + name + ' not found.' );
		return member;

	}

	findUser( name ) { return null; }

	// add a running plugin instance.
	addInstance( inst ) {
		this._instances.push( inst );
	}

	// a cmd routed to this context is dispatched
	// to the target object.
	bindCommand( cls, target ) {
		this._cmdRoutes[cls.name] = target;
	}

	routeCommand( cmd, args ) {

		let target = this._cmdRoutes[ cmd.instClass.name ];
		if ( target == null ) {

			// instantiate the cmd class.
			target = new cmd.instClass( this );
			this._cmdRoutes[ cmd.instClass.name ] = target;

		}
		cmd.func.apply( target, args );

	}

	// objs are idables or path strings.
	getDataKey( ...objs ) {}

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

	// recieved message.
	message( m ) {
	}

}

exports.UserContext = class extends Context {

	get type() { return 'user'; }
	get name() { return this._idobj.username; }

	// objs are idables or path strings.
	getDataKey( ...objs ) {
		return fsys.channelPath( this._idobj, objs );
	}

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

	// objs are idables or path strings.
	getDataKey( ...objs ) {
		return fsys.channelPath( this._idobj, objs );
	}

	findUser( name ){
		return this._idobj.nicks.find( val => val.toLowerCase() === name.toLowerCase() );
	}

}

exports.GuildContext = class extends Context {

	// objs are idables or path strings.
	getDataKey( ...objs ) {
		return fsys.guildPath( this._idobj, objs );
	}

	get type() { return 'guild'; }
	get name() { return this._idobj.name; }

	findUser( name ) {

		let user = this._idobj.members.find(
			gm => gm.displayName.toLowerCase() === name.toLowerCase()
		);
		return user;

	}

}