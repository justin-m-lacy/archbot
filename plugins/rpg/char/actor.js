const Dice = require( '../dice.js');
const Loc = require( '../world/loc.js');
const stats = require( './stats.js');

exports.Actor = class Actor {

	static FromJSON( json, act ) {

		if ( json.statMods ) {
			// apply last.
			let mods = json.statMods;
			let mod;
			for( let i = mods.length-1; i >= 0; i-- ) {
				let mod = StatMod.FromJSON( mods[i]);
				if ( mod ) act.addMod( mod );
			}
		}

	}

	get hp() { return this._curStats._curHp; }
	set hp( v) { this._curStats._curHp = v; }

	get curHp() { return this._curStats._curHp; }

	get maxHp() { return this._curStats._maxHp; }
	set maxHp(v ) { this._curStats.maxHp = v; }

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

	/**
	 * array of current stat mods.
	 */
	get statMods() { return this._statMods; }
	set statMods(v) { this._statMods = v; }

	get curStats() { return this._curStats; }
	set curStats(v) { this._curStats = v; }
	
	get info() { return this._info; }
	set info( v ) { this._info = v; }

	get curMods() { return this._curMods; }
	set curMods(v) { this._curMods = v; }

	// Loc.Coord
	get loc() { return this._loc; }
	set loc(v) { this._loc = v; }

	constructor( race ) {

		this._baseStats = new stats.StatBlock();
		this._curStats = new stats.StatBlock();

		this._statMods = [];
		this._info = {};

		this._race = race;

		this._loc = new Loc.Coord( 0,0);

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
		let hp = this._baseStats.maxHp + level*this.getModifier('con');

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
		let maxHp = Math.floor( (hd)/2 );

		for( let i = this._baseStats.level-1; i > 0; i-- ) {
			maxHp += Dice.roll( 1, hd );
		}

		this._baseStats.maxHp = maxHp;

	}

	applyRace() {

		if ( !this._race ) return;
		this.applyBaseMods( this._race.baseMods );

	}

	/**
	 * 
	 * @param {stats.StatMod} mod 
	 */
	addMod( mod ) {

		this._statMods.add( mod );
		mod.apply( this._curStats );
	}

	/**
	 * 
	 * @param {stats.StatMod} mod 
	 */
	removeMod( mod ) {
		let i = this._statMods.indexOf( mod );
		if ( i >= 0 ) {
			this._statMods.splice( i, 1 );
			mod.remove( this._curStats );
		}
	}

	applyBaseMods( mods ) {

		if ( !mods ) return;
		let stats = this._curStats;
		let mod;
		let val;

		for( let k in mods ) {

			mod = mods[k];
			if ( typeof(mod) === 'string' ) {
				mod = Dice.parseRoll(mod);
			}

			val = stats[k];
			if ( val ){

				val += mod;
				if ( val < 3 ) val = 3;
				stats[k] = val;

			}
			else stats[k] = mod;

		}

	}

} //cls