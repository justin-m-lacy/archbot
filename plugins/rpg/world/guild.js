const Inv = require( '../inventory.js');
const Char = require( '../char/char.js');
const Loc = require( './loc.js');

module.exports = class Guild {

	static GuildCache() { return this.cache; }
	static SetCache(v) { this.cache = v; }

	static async GetGuild( name ) {

		let data = this.cache.get( name );
		if ( data ) return data;

		data = await this.cache.fetch( name );
		if ( !data ) return;

		if ( data instanceof Guild ) return data;
	
		data = this.FromJSON( data );
		this.cache.cache( name, data );

		return data;

	}

	static async MakeGuild( name, leader ) {

		let g = new Guild(name);
		g.leader = leader.name;
		g.roster.push(leader.name );
		g.time = Date.now();
	
		await this.cache.store( name, g );
		return g;

	}

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

	get name() { return this._name; }
	set name(v) { this._name = v;}

	get leader() { return this._leader;}
	set leader(v) { this._leader = v;}

	get desc() { return this._desc; }
	set desc(v) { this._desc = v; }

	get roster() { return this._roster; }
	set roster(v) { this._roster = v;}

	get inv() { return this._inv; }
	set inv( v ) { this._inv = v; }

	get invites() { return this._invites; }
	set invites(v) { this._invites = v; }

	get level() { return this._level; }
	set level(v) { this._level = v; }

	get loc() { return this._loc; }
	set loc(v) { this._loc.setTo(v); }

	get exp() { return this._exp; }
	set exp( v ) { this._exp = v; }

	get time() { return this._time; }
	set time(v) { this._time = v;}

	constructor( name ) {

		this._name = name;
		this._exp = 0;
		this._invites = [];
		this._roster = [];
		this._level = 1;

	}

	getList() {
		return this._name + ":\n" + this._roster.join('\n');
	}

	setLeader(char) { this._leader = char.name; }
	isLeader( char ) { return this._leader === char.name; }

	/**
	 * 
	 * @param {string|Char} char 
	 */
	includes( char ) {
		if ( typeof(char)==='string') return this._roster.includes(char);
		return this._roster.includes(char.name);
	}

	invite(char) {

		let name = char.name;

		if ( this._invites.includes(name) || this._roster.includes(name ) ) return;
		this._invites.push(name);

	}

	accept( char ) {

		let name = char.name;
		let ind = this._invites.indexOf( name );
		if ( ind < 0 ) return false;

		this._invites.splice(ind, 1);
		this._roster.push( name );

		return true;

	}

		/**
	 * 
	 * @param {string} name
	 * @returns true if the party should be removed. false otherwise. 
	 */
	leave( char ) {

		let name = char.name;
		let ind = this._roster.indexOf( name );
		if ( ind >= 0 ) {

			this._roster.splice(ind, 1);
			if ( this._roster.length === 0 ||
				(this._roster.length === 1 && this._invites.length === 0) ) return true;

			if ( this._leader === name ) this._leader = this._roster[0];

		}
		return false;
	}

}