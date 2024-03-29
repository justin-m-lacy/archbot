export const getEvil = (evil: number) => {

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

export const pointStats = ['str', 'con', 'dex', 'int', 'wis', 'char', 'armor'];

export type StatName = 'evil' | 'str' | 'con' | 'dex' | 'int' | 'wis' | 'cha' | 'armor' | 'maxHp' | 'maxMp' | 'level' | 'dr' | 'age';

export type StatKey = keyof StatBlock;

export type StatMod = Partial<{ [Property in StatName]: number }>;

export interface IStatBlock {

	evil: number;

	maxHp: number;

	curHp: number;

	maxMp: number;

	curMp: number;

	level: number;

	armor: number;

	// damage reduction.
	dr: number;

	// resistances
	get resist();
	set resist(v: number);

	str: number;
	con: number;
	dex: number;
	int: number;
	wis: number;
	cha: number;
	/*get cha() { return this._cha; }
	set cha(v) { this._cha = v; }*/

}
export default class StatBlock implements IStatBlock {

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

	//----
	private _evil: number = 0;
	private _maxHp: number = 0;
	private _curHp: number = 0;
	private _maxMp: number = 0;
	private _curMp: number = 0;
	private _level: number = 0;

	private _armor: number = 0;
	private _dr: number = 0;
	private _resist: any;

	private _str: number = 0;
	private _con: number = 0;
	private _dex: number = 0;
	private _int: number = 0;
	private _wis: number = 0;
	private _cha: number = 0;

	constructor() { }

	static FromJSON(json: any) {

		const stats = new StatBlock();

		for (const k in json) {
			if (stats.hasOwnProperty(k)) stats[k as StatKey] = json[k];
		}

		if (!json.evil) stats.evil = 0;

		// LEGACY
		if (json.hp) stats._maxHp = json.hp;
		if (!json.curHp) stats._curHp = stats._maxHp;
		if (!json.curMp && stats._maxMp) stats._curMp = stats._maxMp;

		return stats;

	}

	/// TODO: damage reduction.
	/*getDR(type: string) {
		if (!this._dr) return 0;
		return this._dr[type] || 0;
	}*/

	toJSON() {

		const o: any = {

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

		if (this._dr) o.dr = this._dr;
		if (this._resist) o.resist = this._resist;

		return o;

	}

	/**
	 * Gets a modifier for a base stat.
	 * @param {*} stat 
	 */
	getModifier(stat: string) {
		const val = stat in this ? this[stat as StatKey] : 0;
		if (!val) return 0;
		return Math.floor((val - 10) / 2);
	}

	addHp(amt: number) {
		this._curHp += amt;
		this._maxHp += amt;
	}

}


/**
 * Class Not yet used.
 */
export class StatMods {

	// { stat->mod }
	get mods() { return this._mods; }
	set mods(v) { this._mods = v; }

	get duration() { return this._duration; }
	set duration(t) { this._duration = t; }

	get startTime() { return this._start; }
	set startTime(t) { this._start = t; }

	private _mods: any;

	private _duration: number = 0;
	private _start: number = 0;

	constructor(mods = null) {

		if (mods) this._mods = mods;
		else this._mods = {};

	}

	static FromJSON(json: any) {

		const mod = new StatMods(json.mods);
		mod._start = json.start;
		mod._duration = json._duration;

		return mod;
	}

	toJSON() {

		return {
			mods: this._mods,
			start: this._start,
			duration: this._duration

		};

	}

	apply(stats: StatBlock) {

		for (let k in this._mods) {

			if (k in stats) {
				stats[k as StatKey] += this._mods[k];
			}

		}
		if (this._duration > 0) this._start = Date.now();

	}

	remove(stats: StatBlock) {

		for (let k in this._mods) {

			if (k in stats) {
				stats[k as StatKey] -= this._mods[k];
			}

		}

	}

}
