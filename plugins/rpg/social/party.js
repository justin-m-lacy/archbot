const loc = require( '../world/loc.js');
module.exports = class Party {

	static FromJSON(json) {

		let p = new Party();

		Object.assign( p, json );

		return p;

	}

	toJSON() {

		return {
			names:this._names,
			leader:this._leader,
			invites:this.pending
		}

	}

	get names() { return this._names; }
	get invites() { return this.pending; }

	get leader() { return this._leader; }
	set leader(n) { this._leader = n; }

	get name() { return this._leader + "'s Party";}

	get loc() { return this._loc; }
	set loc(v) { this._loc.setTo(v); }

	async getState() {

		let char;
		for( let i = this._names.length-1; i >= 0; i-- ) {

			char = await this._cache.fetch( this._names[i]);
			if ( char && char.isAlive() ) return 'alive';

		} //
		return 'dead';

	}

	constructor( leader, cache ) {

		this._cache = cache;

		this._names = [ leader.name ];
		this.pending = [];

		this._leader = leader.name;
		this._loc = new loc.Coord( leader.loc.x, leader.loc.y );

	}

	/**
	 * 
	 * @param {string} name 
	 */
	async getChar( name ) { return this._cache.fetch( name ); }

	/**
	 * 
	 * @param {Loc.Coord} coord 
	 */
	async move( coord ) {

		this.loc = coord;

		for( let i = this._names.length-1; i >= 0; i-- ) {

			var char = await this._cache.fetch( this._names[i]);
			if ( char ) { char.loc = coord; char.recover(); }

		} //

	}

	async rest() {

		for( let i = this._names.length-1; i >= 0; i-- ) {

			var char = await this._cache.fetch( this._names[i]);
			if ( char && char.isAlive() ) char.rest();

		} //

	}

	async recover() {

		for( let i = this._names.length-1; i >= 0; i-- ) {

			var char = await this._cache.fetch( this._names[i]);
			//console.log( 'moving char: ' + char.name + ' to: ' + coord.toString() );
			if ( char && char.isAlive() ) return;

		} //

	}

	async getStatus() {
		let res = this._leader + "'s Party:";

		let len = this._names.length;
		for( let i = 0; i < len; i++ ) {
			var char = await this._cache.fetch( this._names[i] );
			res += `\n${char.name}  ${char.getStatus()}`;
		}

		return res;

	}

	getList() { return this._leader + "'s Party:\n" + this._names.join('\n'); }


	isLeader( char ) { return this._leader === char.name; }
	setLeader(char) {

		let name = (typeof(char) === 'string') ? char : char.name;
		if ( !this._names.includes(name)) return false;
	
		this._leader = name;
		return true;

	}

	/**
	 * 
	 * @param {string|Char} char 
	 */
	includes( char ) {
		if ( typeof(char)==='string') return this._names.includes(char);
		return this._names.includes(char.name);
	}

	async addExp( exp ) {

		let count = this._names.length;

		// add exp bonus for party members.
		exp = Math.floor( exp*( 1 + count*0.15 ) / count );

		console.log( 'EXP PER PERSON: ' + exp );

		for( let i = count-1; i>= 0; i-- ) {

			var c = await this._cache.fetch( this._names[i] );
			if ( c ) c.addExp( exp)

		}

	}

	/**
	 * Returns a random alive character from a group.
	 */
	async randAlive() {

		let len = this._names.length;
		let ind = Math.floor( Math.random()*len );
		let start = ind;

		do {

			var c = await this._cache.fetch( this._names[ind] );
			if ( c && c.state === 'alive' ) return c;

			if ( ++ind >= len ) ind = 0;

		} while ( ind != start );

		return null;

	}


	/**
	 * A valid target must be alive and have positive hitpoints.
	 */
	async randTarget() {

		let len = this._names.length;
		let ind = Math.floor( Math.random()*len );
		let start =ind;

		do {

			var c = await this._cache.fetch( this._names[ind] );
			if ( c && c.curHp > 0 && c.state === 'alive' ) return c;

			console.log( this._names[ind] + ' NOT A VALID TARGEt.');
			if ( ++ind >= len ) ind = 0;

		} while ( ind != start );

		return null;

	}

	async randChar() {
		return this._cache.fetch( this._names[ Math.floor( this._names.length*Math.random() )] );
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

		console.log( char.name + ' attempting to leave party.');

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