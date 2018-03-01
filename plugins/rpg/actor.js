const Dice = require( './dice.js');

module.exports = class Actor {

	get hp() { return this._curStats._hp; }
	set hp( v) { this._curStats._hp = v; }

	get name() { return this._name;}
	set name( v ) { this._name = v; }

	get race() { return this._race; }
	set race( r) { this._race =  r; }

	get level() { return this._curStats._level; }
	set level( n ) { this._curStats._level = n; }

	get baseLevel() { return this._baseStats._level; }
	set baseLevel( v ) {  this._baseStats._level = v; }

	get gold() { return this._info.gold; }
	set gold( g ) { this._info.gold = g; }

	get sex() { return this._info.sex; }
	set sex(s) { this._info.sex = s; }
	get weight() { return this._info.weight; }
	set weight(s) { this._info.weight = s; }
	get age() { return this._info.age; }
	set age(s) { this._info.age = s; }
	get height() { return this._info.height; }
	set height(s) { this._info.height = s; }


	get str() { return this._curStats._str; }
	set str(v) { this._curStats._str = v; }
	get con() { return this._curStats._con; }
	set con(v) { this._curStats._con = v; }
	get dex() { return this._curStats._dex; }
	set dex(v) { this._curStats._dex = v; }
	get int() { return this._curStats._int; }
	set int(v) { this._curStats._int = v; }
	get wis() { return this._curStats._wis; }
	set wis(v) { this._curStats._wis = v; }
	get cha() { return this._curStats._cha; }
	set cha(v) { this._curStats._cha = v; }

	/**
	 * Base stats before race/class modifiers.
	 */
	get baseStats() { return this._baseStats; }
	set baseStats(v) { this._baseStats = v; }

	get curStats() { return this._curStats; }
	set curStats(v) { this._curStats = v; }
	
	get info() { return this._info; }
	set info( v ) { this._info = v; }

	get curMods() { return this._curMods; }
	set curMods(v) { this._curMods = v; }

	constructor( race ) {

		this._baseStats = new StatBlock();
		this._curStats = new StatBlock();
		this._info = {};

		this._race = race;

		this._curMods = [];

	}

	addGold( amt ) {
		this._info.gold += amt;
	}

	getModifier( stat ) {
		if ( !this._curStats.hasOwnProperty(stat) ) return 0;
		return Math.floor( ( this._curStats[stat] - 10)/2 );
	}

	/**
	 * Computes current, as opposed to base hp.
	*/
	computeHp() {

		let level = this._curStats.level;
		let hp = this._baseStats.hp + level*this.getModifier('con');

		// temp levels.
		for( let i = level - this._baseStats.level; i > 0; i-- ) {
			hp += Dice.roll( 1, hd );
		}

		if ( hp < 1 ) hp = 1;
		this.hp = hp;

	}

	setBaseStats( base ) {

		this._baseStats = base;

		let cur = this._curStats;

		for( let k in base ) {
			cur[k] = base[k];
		}

		this.applyRace();
		this.computeHp();

	}

	/**
	 * reroll hp.
	*/
	rollBaseHp() {

		let hd = this._race.hitdice;
		let hp = Math.floor( (hd)/2 );

		for( let i = this._baseStats.level-1; i > 0; i-- ) {
			hp += Dice.roll( 1, hd );
		}

		this._baseStats.hp = hp;

	}

	applyRace() {

		if ( this._race == null ) return;
		this.applyMods( this._race.baseMods );

	}

	applyMods( mods ) {

		if ( mods == null ) return;
		let stats = this._curStats;
		let mod;
		let val;

		for( let k in mods ) {

			mod = mods[k];
			if ( typeof(mod) === 'string' ) {
				mod = Dice.parseRoll(mod);
			}

			val = stats[k];
			if ( val != null ){

				val += mod;
				if ( val < 3 ) {
					val = 3;
				}
				stats[k] = val;

			}
			else stats[k] = mod;

		}

	}

} //cls

const saveProps = [ 'name', 'level', 'info', 'baseStats' ];
class StatBlock {

	get hp() { return this._hp; }
	set hp( v) { this._hp = v; }

	get level() { return this._level; }
	set level( n ) { this._level = n; }

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
	 * Isn't this just object.assign()?
	 * @param {Object} json 
	 */
	static FromJSON( json ) {

		let stats = new StatBlock();

		let p;
		let priv;
		for( let k in json ) {
			if ( stats.hasOwnProperty(k)) stats[k] = json[k];
		}

		return stats;

	}

	toJSON() {
	
		return {
			hp:this._hp,
			level:this._level,

			str:this._str,
			con:this._con,
			dex:this._dex,
			int:this._int,
			wis:this._wis,
			cha:this._cha

		};

	}

	constructor() {
		this._level = 1;
	}

}