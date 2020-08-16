const loc = require( '../world/loc.js');
const SocialGroup = require('./socialGroup');

module.exports = class Party extends SocialGroup {

	static FromJSON(json) {

		let p = new Party();

		Object.assign( p, json );

		return p;

	}

	toJSON() {

		return {
			roster:this.names,
			leader:this.leader,
			invites:this.pending
		}

	}

	/**
	 * @deprecated
	 */
	get names() { return this.roster; }
	set names(v) { this.roster = v;}

	get loc() { return this._loc; }
	set loc(v) { this._loc.setTo(v); }

	async getState() {

		let char;
		for( let i = this.roster.length-1; i >= 0; i-- ) {

			char = await this._cache.fetch( this.roster[i]);
			if ( char && char.isAlive() ) return 'alive';

		} //
		return 'dead';

	}

	constructor( leader, cache ) {

		super();

		this._cache = cache;

		this.roster = [ leader.name ];

		this.leader = leader.name;
		this.name = this._leader + "'s Party";

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

		let roster = this.roster;

		for( let i = roster.length-1; i >= 0; i-- ) {

			var char = await this._cache.fetch( roster[i]);
			if ( char ) {
				char.loc = coord;
				if ( char.isAlive() ) char.recover();
			}

		} //

	}

	async rest() {

		let hp = 0;
		let max = 0;

		let roster = this.roster;

		for( let i = roster.length-1; i >= 0; i-- ) {

			var char = await this._cache.fetch( roster[i]);
			if ( !char) continue;
			if ( char.isAlive() ) char.rest();
			hp += char.curHp;
			max += char.maxHp;

		} //

		return hp/max;
	}

	async recover() {

		let roster = this.roster;

		for( let i = roster.length-1; i >= 0; i-- ) {

			var char = await this._cache.fetch( roster[i]);
			//console.log( 'moving char: ' + char.name + ' to: ' + coord.toString() );
			if ( char && char.isAlive() ) char.recover();

		} //

	}

	async getStatus() {

		let res = this.name + ':';

		let roster = this.roster;
		let len = roster.length;

		for( let i = 0; i < len; i++ ) {
			var char = await this._cache.fetch( roster[i] );
			res += `\n${char.name}  ${char.getStatus()}`;
		}

		return res;

	}

	async addExp( exp ) {

		let count = this.roster.length;

		// add exp bonus for party members.
		exp = Math.floor( exp*( 1 + count*0.15 ) / count );

		console.log( 'EXP PER PERSON: ' + exp );

		for( let i = count-1; i>= 0; i-- ) {

			var c = await this._cache.fetch( this.roster[i] );
			if ( c ) c.addExp( exp)

		}

	}

	/**
	 * Returns a random alive character from a group.
	 */
	async randAlive() {

		let len = this.roster.length;
		let ind = Math.floor( Math.random()*len );
		let start = ind;

		do {

			var c = await this._cache.fetch( this.roster[ind] );
			if ( c && c.state === 'alive' ) return c;

			if ( ++ind >= len ) ind = 0;

		} while ( ind != start );

		return null;

	}


	/**
	 * A valid target must be alive and have positive hitpoints.
	 */
	async randTarget() {

		let len = this.roster.length;
		let ind = Math.floor( Math.random()*len );
		let start =ind;

		do {

			var c = await this._cache.fetch( this.roster[ind] );
			if ( c && c.curHp > 0 && c.state === 'alive' ) return c;

			console.log( this.roster[ind] + ' NOT A VALID TARGEt.');
			if ( ++ind >= len ) ind = 0;

		} while ( ind != start );

		return null;

	}

	async randChar() {
		return this._cache.fetch( this.roster[ Math.floor( this.roster.length*Math.random() )] );
	}

	randName() {
		return this.roster[ Math.floor( this.roster.length*Math.random() )];
	}

}