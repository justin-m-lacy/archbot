const loc = require( './world/loc.js');
module.exports = class Party {

	get names() { return this._names; }
	get invites() { return this.pending; }

	get leader() { return this._leader; }
	set leader(n) { this._leader = n; }

	get name() { return this._leader + "'s Party ";}

	get loc() { return this._loc; }
	set loc(v) { this._loc.setTo(v); }

	constructor( leader, cache ) {

		this._cache = cache;

		this._names = [ leader.name ];
		this.pending = [];

		this._leader = leader.name;
		this._loc = new loc.Coord( leader.loc.x, leader.loc.y );

	}

	move( coord ) {
	}

	getList() {
		return this._leader + "'s Party:\n" + this._names.join('\n');
	}

	setLeader(char) { this._leader = char.name; }
	isLeader( char ) { return this._leader === char.name; }

	/**
	 * 
	 * @param {string|Char} char 
	 */
	includes( char ) {
		if ( typeof(char)==='string') return this._names.includes(char);
		return this._names.includes(char.name);
	}

	randName() {
		return this._names[ Math.floor( this._names.length*Math.random() )];
	}

	invite(char) {

		let name = char.name;

		if ( this.pending.includes(name) || this._names.includes(name ) ) return;
		this.pending.push(name);

	}

	accept( char ) {

		let name = char.name;
		let ind = this.pending.indexOf( name );
		if ( ind < 0 ) return false;

		this.pending.splice(ind, 1);
		this._names.push( name );

		return true;

	}

	/**
	 * 
	 * @param {string} name
	 * @returns true if the party should be removed. false otherwise. 
	 */
	leave( char ) {

		let name = char.name;
		let ind = this._names.indexOf( name );
		if ( ind >= 0 ) {

			this._names.splice(ind, 1);
			if ( this._names.length === 0 ||
				(this._names.length === 1 && this.invites.length === 0) ) return true;

			if ( this._leader === name ) this._leader = this._names[0];

		}
		return false;
	}

}