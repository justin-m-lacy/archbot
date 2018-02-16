const Discord = require('discord.js');

// context for processing client events.
module.exports = class {

	// 'guild', 'user', 'dm', 'group', 'channel'
	get type() { return this._type; }

	get context() { return this._context; }

	get bot() { return this._bot; }

	get cache() { return this._cache; }

	/**
	 * @param {discord object} contextObj - the discord guild, channel, or user
	 * that servers as the basis for the context.
	 */
	constructor( bot, contextObj, type ) {

		this._context = contextObj;
		this._bot = bot;

		// plugin instances running.
		this._instances = [];

		// routed commands.
		this._cmdRoutes = {};

		if ( type == null ){
			this._type = this.findType( contextObj);
		}
		this._type = type;

	}

	// add a running plugin instance.
	addInstance( inst ) {
		this._instances.add( inst );
	}

	// cmd routed to this context dispatched
	// to the target method.
	bindCommand( name, target ) {
		this._cmdRoutes[name] = target;
	}

	routeCommand( name, args ) {

		let target = this._cmdRoutes[ name ];
		if ( target != null ) {

			target.call( null, args );

		} else return 'Command not found.';

	}

	// recieved message.
	message( m ) {
	}

	findType( obj ) {

		if ( obj instanceof Discord.Guild ){
			return 'guild';
		}
		if ( obj instanceof Discord.User){
			return 'user';
		}
		if ( obj instanceof Discord.DMChannel){
			return 'dm';
		}
		if ( obj instanceof Discord.GroupDMChannel) {
			return 'group';
		}
		if ( obj instanceof Discord.Channel) {
			return 'channel';
		}

	}

}