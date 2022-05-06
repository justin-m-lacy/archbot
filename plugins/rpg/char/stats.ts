// Currently Unused.
class StatMods {

	static FromJSON(json) {

		let mod = new StatMods(json.mods);
		mod._start = json.start;
		mod._duration = json._duration;

	}

	toJSON() {

		return {
			mods: this._mods,
			start: this._start,
			duration: this._duration

		};

	}

	// { stat->mod }
	get mods() { return this._mods; }
	set mods(v) { this._mods = v; }

	get duration() { return this._duration; }
	set duration(t) { this._duration = t; }

	get startTime() { return this._start; }
	set startTime(t) { this._start = t; }

	constructor(mods = null) {

		if (mods) this._mods = mods;
		else this._mods = {};

	}

	apply(stats) {

		for (let k in this._mods) {

			if (stats.hasOwnProperty[k]) {
				stats[k] += this._mods[k];
			}

		}
		if (this._duration > 0) this._start = Date.now();

	}

	remove(stats) {

		for (let k in this._mods) {

			if (stats.hasOwnProperty[k]) {
				stats[k] -= this._mods[k];
			}

		}

	}

}

exports.getEvil = evil => {

	if (!evil) return 'neutral';

	if (evil >= 5) {

		if (evil > 40) return 'diabolical';
		if (evil > 30) return 'malevolent';
		if (evil > 20) return 'evil';
		if (evil > 10) return 'wicked';
		return 'mean';

	} else if (evil <= -5) {

		if (evil < -40) return 'righteous';
		if (evil < -30) return 'virtuous';
		if (evil < -20) return 'good';
		if (evil < -10) return 'nice';

		return 'polite';

	} else return 'neutral';

	//if ( evil < -30 ) return 'diabolical'
	//['mean','wicked', 'evil', 'diabolical'],
	//['nice', 'good', '', 'righteous'];

};

exports.pointStats = ['str', 'con', 'dex', 'int', 'wis', 'char', 'armor'];

class StatBlock {

	get evil() { return this._evil; }
	set evil(v) { this._evil = v; }

	get maxHp() { return this._maxHp; }
	set maxHp(v) {
		this._maxHp = v;
		if (this._curHp > v) this._curHp = v;
	}

	get curHp() { return this._curHp; }
	set curHp(v) {
		this._curHp = v > this._maxHp ? this._maxHp : v;
	}

	get maxMp() { return this._maxMp; }
	set maxMp(v) { this._maxMp = v; }

	get curMp() { return this._curMp; }
	set curMp(v) { this._curMp = v > this._maxMp ? this._maxMp : v; }

	get level() { return this._level; }
	set level(n) { this._level = n; }

	get armor() { return this._armor; }
	set armor(v) { this._armor = v; }

	// damage reduction.
	get dr() { return this._dr || 0; }
	set dr(v) { this._dr = v; }

	// resistances
	get resist() { return this._resist || null; }
	set resist(v) { this._resist = v; }

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

	static FromJSON(json) {

		let stats = new StatBlock();

		for (let k in json) {
			if (stats.hasOwnProperty(k)) stats[k] = json[k];
		}

		if (!json.evil) this.evil = 0;

		// LEGACY
		if (json.hp) stats._maxHp = json.hp;
		if (!json.curHp) stats._curHp = stats._maxHp;
		if (!json.curMp && stats._maxMp) stats._curMp = stats._maxMp;

		return stats;

	}

	getDR(type) {
		if (!this._dr) return 0;
		return this._dr[type] || 0;
	}

	toJSON() {

		let o = {

			maxHp: this._maxHp,
			curHp: this._curHp,
			level: this._level,
			armor: this._armor,

			maxMp: this._maxMp,
			curMp: this._curMp,

			evil: this._evil,

			str: this._str,
			con: this._con,
			dex: this._dex,
			int: this._int,
			wis: this._wis,
			cha: this._cha

		};

		if (this._dr) json.dr = this._dr;
		if (this._resist) json.resist = this._resist;

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
	getModifier(stat) {
		let val = this[stat];
		if (!val) return 0;
		return Math.floor((val - 10) / 2);
	}

	addHp(amt) {
		this._curHp += amt;
		this._maxHp += amt;
	}

}

class CharStats {

	static FromJSON(json) {
		let s = new CharStats();
		return s;
	}

	toJSON() {
		return this;
	}

	get evil() { return this._cur.evil; }
	set evil(v) { this._cur.evil = v; }

	get maxHp() { return this._maxHp; }
	set maxHp(v) {
		this._max.hp = v;
		if (this._cur.hp > v) this._cur.hp = v;
	}

	get curHp() { return this._cur.hp; }
	set curHp(v) {
		this._cur.hp = v > this._max.hp ? this._max.hp : v;
	}

	get maxMp() { return this._max.mp; }
	set maxMp(v) { this._max.mp = v; }

	get curMp() { return this._cur.mp; }
	set curMp(v) { this._cur.mp = v > this._max.mp ? this._max.mp : v; }

	get level() { return this._cur.level; }
	set level(n) { this._cur.level = n; }

	get armor() { return this._cur.armor; }
	set armor(v) { this._cur.armor = v; }

	// damage reduction.
	get dr() { return this._cur.dr || 0; }
	set dr(v) { this._cur.dr = v; }

	// resistances
	get resist() { return this._cur.resist || null; }
	set resist(v) { this._cur.resist = v; }

	get str() { return this._cur.str; }
	set str(v) { this._cur.str = v; }
	get con() { return this._cur.con; }
	set con(v) { this._cur.con = v; }
	get dex() { return this._cur.dex; }
	set dex(v) { this._cur.dex = v; }
	get int() { return this._cur.int; }
	set int(v) { this._cur.int = v; }
	get wis() { return this._cur.wis; }
	set wis(v) { this._cur.wis = v; }
	get cha() { return this._cur.cha; }
	set cha(v) { this._cur.cha = v; }

	constructor() {

		this._base = {};
		this._max = {};
		this._cur = {};

	}

}

exports.StatBlock = StatBlock;