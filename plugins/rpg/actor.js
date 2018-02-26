const Dice = require( './dice.js');

module.exports = class Actor {

	get hp() { return this._hp; }
	set hp( v) { this._hp = v; }

	get name() { return this._name;}
	set name( v ) { this._name = v; }

	get race() { return this._race; }
	set race( r) { this._race =  r; }

	get level() { return this._level; }
	set level( n ) { this._level = n; }

	get gold() { return this._gold; }
	set gold( g ) { this._gold = g; }

	get info() { return this._info; }
	set info( v ) { this._info = v; }
	get sex() { return this._info._sex; }
	set sex(s) { this._info._sex = s; }
	get weight() { return this._info._weight; }
	set weight(s) { this._info._weight = s; }
	get age() { return this._info._age; }
	set age(s) { this._info._age = s; }
	get height() { return this._info._height; }
	set height(s) { this._info._height = s; }


	get str() { return this._str; }
	set str(v) { this._str = v; }
	get con() { return this._con; }
	set con(v) { this._con = v; }
	get dex() { return this._dex; }
	set dex(v) { this._dex = v; }
	get int() { return this._int; }
	set int(v) { this._int = v; }
	get wis() { return this._wis; }
	set wis(v) { this._wis = v; }
	get cha() { return this._cha; }
	set cha(v) { this._cha = v; }

	/**
	 * Base stats before race/class modifiers.
	 */
	get baseStats() { return this._baseStats; }
	set baseStats(v) { this._baseStats = v; }

	constructor() {

		this._baseStats = {};
		this._info = {};

		// temp compatible.
		this._stats = this;

	}

	/**
	 * Sets non-random starting props.
	*/
	initNew() {
		this._level = 1;
		this._hp = 0;
	}

	getModifier( stat ) {
		if ( !this._stats.hasOwnProperty(stat) ) return 0;
		return Math.floor( ( this._stats[stat] - 10)/2 );
	}

	computeHp() {
		this._hp = this._baseStats.hp + this._level*this.getModifier('con');
		if ( this._hp < 1 ) this._hp = 1;
	}

	setBaseStats( base ) {

		this._baseStats = base;

		for( let k in base ) {
			this[k] = base[k];
		}

		this.computeHp();
		this.applyRace();

	}

	/**
	 * reroll hp.
	*/
	rollHp() {

		let hd = this._race.hitdice;
		let hp = Math.floor( (hd)/2 );

		for( let i = this._level-1; i > 0; i-- ) {
			hp += Dice.roll( 1, hd );
		}

		this._baseStats.hp = hp;
		this.computeHp();

	}

	applyRace() {

		if ( this._race == null ) return;
		this.applyMods( this._race.statMods );

	}

	applyMods( mods ) {

		if ( mods == null ) return;
		let mod;
		let val;

		for( let k in mods ) {

			mod = mods[k];
			if ( typeof(mod) === 'string' ) {
				mod = dice.parseRoll(mod);
			}

			val = this[k];
			if ( val != null ){

				val += mod;
				if ( val < 3 ) {
					val = 3;
				}
				this[k] = val;

			}
			else this[k] = mod;

		}

	}

} //cls