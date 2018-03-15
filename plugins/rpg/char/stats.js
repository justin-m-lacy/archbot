
class StatMods {

	static FromJSON(json){

		let mod = new StatMods( json.mods );
		mod._start = json.start;
		mod._duration = json._duration;

	}

	toJSON() {

		return {
			mods:this._mods,
			start:this._start,
			duration:this._duration

		};

	}

	// { stat->mod }
	get mods() { return this._mods; }
	set mods(v) { this._mods = v; }

	get duration() { return this._duration; }
	set duration(t) { this._duration = t;}

	get startTime() { return this._start; }
	set startTime(t) { this._start = t;}

	constructor( mods=null ) {

		if ( mods ) this._mods = mods;
		else this._mods = {};

	}

	apply( stats ) {

		for( let k in this._mods ) {

			if ( stats.hasOwnProperty[k] ) {
				stats[k] += this._mods[k];
			}

		}
		if ( this._duration > 0 ) this._start = Date.now();

	}

	remove( stats ) {

		for( let k in this._mods ) {

			if ( stats.hasOwnProperty[k] ) {
				stats[k] -= this._mods[k];
			}

		}

	}

}

class StatBlock {

	set hp(v) {
		this._maxHp = this._curHp = v;
	}

	get maxHp() { return this._maxHp; }
	set maxHp( v) {
		this._maxHp = v;
		if ( this._curHp > v ) this._curHp = v;
	}

	get curHp() { return this._curHp; }
	set curHp( v) { this._curHp = v; }

	get level() { return this._level; }
	set level( n ) { this._level = n; }

	get armor() { return this._armor; }
	set armor(v) { this._armor = v; }

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

	static FromJSON( json ) {

		let stats = new StatBlock();

		let p;
		let priv;
		for( let k in json ) {
			if ( stats.hasOwnProperty(k)) stats[k] = json[k];
		}

		// LEGACY
		if ( json.hp ) stats._maxHp = json.hp;
		if ( !json.curHp ) stats._curHp = stats._maxHp;

		return stats;

	}

	toJSON() {
	
		let o = {

			maxHp:this._maxHp,
			curHp:this._curHp,
			level:this._level,
			armor:this._armor,

			str:this._str,
			con:this._con,
			dex:this._dex,
			int:this._int,
			wis:this._wis,
			cha:this._cha

		};

		return o;

	}

	constructor() {
		this._level = 1;
		this._armor = 0;
	}

	/**
	 * Gets a modifier for a base stat.
	 * @param {*} stat 
	 */
	getModifier( stat ) {
		if ( !this.hasOwnProperty(stat) ) return 0;
		return Math.floor( ( this[stat] - 10)/2 );
	}

	addHp( amt ) {
		this._curHp += amt;
		this._maxHp += amt;
	}

}
exports.StatMod = StatMods;
exports.StatBlock = StatBlock;