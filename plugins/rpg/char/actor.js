const dice = require( '../dice.js');
const Loc = require( '../world/loc.js');
const stats = require( './stats.js');

exports.Alive = 'alive';
exports.Dead = 'dead';

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

	// used in combat
	async getState() { return this._state; }

	get state() { return this._state; }
	set state(v) { this._state = v; }

	// old.
	get hp() { return this._curStats._curHp; }
	set hp(v ) { this._curStats.curHp = v; }

	get curHp() { return this._curStats._curHp; }
	set curHp(v) { this._curStats.curHp = v; }

	get curMp() { return this._curStats.curMp; }
	set curMp(v) { this._curStats.curMp = v; }

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

	get guild() { return this._guild; }
	set guild(v) { this._guild = v; }

	get sex() { return this._info.sex; }
	set sex(s) { this._info.sex = s; }
	get weight() { return this._info.weight; }
	set weight(s) { this._info.weight = s; }
	get age() { return this._info.age; }
	set age(s) { this._info.age = s; }
	get height() { return this._info.height; }
	set height(s) { this._info.height = s; }

	get armor() { return this._curStats._armor; }

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

	get HD() { return this._charClass ? Math.floor( (this._charClass.HD + this._race.HD)/2 ) : this._race.HD; }

	get effects() { return this._effects; }
	set effects(v) { this._effects = v; }

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

	get toHit() { return this.getModifier('dex'); }

	// Loc.Coord
	get loc() { return this._loc; }
	set loc(v) { this._loc.setTo( v ); }

	constructor( race ) {

		this._baseStats = new stats.StatBlock();
		this._curStats = new stats.StatBlock();

		this._statMods = [];
		this._info = {};

		this._race = race;

		this._loc = new Loc.Coord( 0,0);

		this._state = exports.Alive;
		this._curMods = [];

	}

	/**
	 * Removes a gold amount or returns false.
	 * @param {number} amt 
	 */
	payOrFail( amt ) {

		if ( amt > this.gold ) return false;
		this.gold -= amt;
		return true;

	}

	statRoll( ...stats ) {
		let roll = this.skillRoll();
		for( let s of stats ) {
			console.log('stat: ' + s);
			roll += this.getModifier( s );
		}
		return roll;

	}
	skillRoll() { return dice.roll( 1, 5*( this._curStats._level+4) ) ;}

	levelUp() {

		this._baseStats.level += 1;
		this._curStats.level += 1;

		let hpBonus = this.HD + this._baseStats.getModifier( 'con' );
		this._baseStats.addHp( hpBonus );
		this._curStats.addHp( hpBonus );

		this.levelFlag = true;

	}

	addGold( amt ) { this._info.gold += amt; }

	/**
	 * 
	 * @param {string} stat 
	 */
	getModifier( stat ) { return this._curStats.getModifier(stat); }

	revive() {

		if ( this.curHp <= 0 ) this.curHp = 1;
		this.state = exports.Alive;

	}

	tick() {
	}

	updateState() {
		if ( this.curHp <= 0 ) this.state = exports.Dead;
		else this.state = exports.Alive;
		return this.state;
	}

	/**
	 * TODO: temp
	 */
	hit( amt ) {
		this.curHp -= amt;
		if ( this.curHp <= 0 ) {
			this.state = exports.Dead;
			return exports.Dead;
		}
	}

	/**
	 * Computes current, as opposed to base hp.
	*/
	computeHp() {

		let hd = this.HD;
		let level = this._curStats.level;
		let hp = this._baseStats.maxHp + level*this.getModifier('con');

		console.log('con:' + this.getModifier('con') );
		// todo: temp levels?

		if ( hp < 1 ) hp = 1;
		this.maxHp = hp;

	}

	setBaseStats( base ) {

		this._baseStats = base;

		Object.assign( this._curStats, base );

		this.applyRace();
		this.computeHp();

	}

	/**
	 * reroll hp.
	*/
	rollBaseHp() {

		let hd = this.HD;
		let maxHp = hd + this._baseStats.getModifier( 'con');

		for( let i = this._baseStats.level-1; i > 0; i-- ) {
			maxHp += dice.roll( 1, hd );
		}

		this._baseStats.maxHp = maxHp;

	}

	applyRace() {

		if ( !this._race ) return;
		this.applyBaseMods( this._race.baseMods );

	}

	heal( amt ) {
		let prev = this.curHp;
		this.curHp += amt;
		return ( this.curHp - prev );
	}

	// recover hp without rest.
	recover() {
		let amt = Math.ceil(this.getModifier('con') + this.getModifier('wis') + this.level)/2;
		if ( amt < 1 ) amt = 1;
		return this.heal( amt );
	}

	rest() {
		let amt = this.getModifier('con') + this.getModifier('wis') + this.level;
		if ( amt < 0 ) amt = 1;
		return this.heal( amt );
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
				mod = dice.parseRoll(mod);
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