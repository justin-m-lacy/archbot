const Inv = require( '../inventory');
const Char = require( '../char/char');
const SocialGroup = require( './socialGroup');
const Loc = require( '../world/loc.js');

/**
 * Can't use statics because static variables from
 * different servers are shared.
 */
class Manager {

	constructor( cache ) {
		this.cache = cache;
	}

	/**
	 *
	 * @param {string} name
	 * @returns {Promise<Guild>}
	 */
	async GetGuild( name ) {

		let data = this.cache.get( name );
		if ( data ) return data;

		data = await this.cache.fetch( name );
		if ( !data ) return;

		if ( data instanceof Guild ) return data;

		data = Guild.FromJSON( data );
		this.cache.cache( name, data );

		return data;

	}

	/**
	 *
	 * @param {*} name
	 * @param {*} leader
	 * @returns {Promise<Guild>}
	 */
	async MakeGuild( name, leader ) {

		let g = new Guild(name);
		g.leader = leader.name;
		g.roster.push(leader.name );
		g.time = Date.now();

		await this.cache.store( name, g );
		return g;

	}

}

class Guild extends SocialGroup {

	static FromJSON( json ) {

		let g = new Guild();

		Object.assign( g, json );

		if ( g._inv ) g._inv = Inv.FromJSON( g._inv );
		else g._inv = new Inv();

		return g;

	}

	toJSON() {

		return {

			name:this._name,
			leader:this._leader,
			desc:this._desc,
			roster:this._roster,
			invites:this._invites,
			inv:this.inv,
			level:this._level,
			loc:this._loc,
			time:this._time,
			exp:this._exp

		};

	}

	get desc() { return this._desc; }
	set desc(v) { this._desc = v; }

	get inv() { return this._inv; }
	set inv( v ) { this._inv = v; }

	get level() { return this._level; }
	set level(v) { this._level = v; }

	get loc() { return this._loc; }
	set loc(v) { this._loc.setTo(v); }

	get exp() { return this._exp; }
	set exp( v ) { this._exp = v; }

	get time() { return this._time; }
	set time(v) { this._time = v;}

	constructor( name ) {

		super();

		this.name = name;
		this._exp = 0;
		this._level = 1;

	}

}

exports.Guild = Guild;
exports.Manager = Manager;