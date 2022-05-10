import { Coord } from '../world/loc';
import Race from './race';
import StatBlock from './stats';
import { StatMods, StatKey, IStatBlock, StatMod, StatName } from './stats';
import { ProtoEffect, Effect } from '../magic/effects';
import CharClass from './charclass';
import { roll, parseRoll } from '../dice';
import { ItemIndex } from '../items/container';
import { Item } from '../items/item';
import Weapon from '../items/weapon';

export type LifeState = 'alive' | 'dead';

export default class Actor implements IStatBlock {

	static FromJSON(json: any, act: Actor) {

		if (json.statMods) {
			// apply last.
			let mods = json.statMods;

			act.statMods = mods as StatMod[];

		}

	}

	// async for combat. TODO: make this better...
	async getState() { return this._state; }

	getStatus() { return `${this.curHp}/${this.maxHp} [${this._state}]` }

	get state() { return this._state; }
	set state(v) { this._state = v; }
	isAlive() { return this._state !== exports.Dead; }

	get evil() { return this._baseStats.evil; }
	set evil(v) { this._baseStats.evil = v; }

	// convenience for shorter formulas.
	get hp() { return this._curStats.curHp; }
	set hp(v) { this._curStats.curHp = v; }

	get dr() { return this._curStats.dr; }
	set dr(v) { this._curStats.dr = v; }

	get resist() { return this._curStats.resist }
	set resist(v) { this._curStats.resist = v; }

	get curHp() { return this._curStats.curHp; }
	set curHp(v) { this._curStats.curHp = v; }

	// convenience for shorter formulas.
	get mp() { return this._curStats.curMp; }
	set mp(v) { this._curStats.curMp = v; }

	get curMp() { return this._curStats.curMp; }
	set curMp(v) { this._curStats.curMp = v; }

	get maxHp() { return this._curStats.maxHp; }
	set maxHp(v) { this._curStats.maxHp = v; }

	get maxMp() { return this._curStats.maxMp; }
	set maxMp(v) { this._curStats.maxMp = v; }

	get name() { return this._name; }
	set name(v) { this._name = v; }

	get race() { return this._race; }
	set race(r) { this._race = r; }

	get level() { return this._curStats.level; }
	set level(n) { this._curStats.level = n; }

	get baseLevel() { return this._baseStats.level; }
	set baseLevel(v) { this._baseStats.level = v; }

	get gold() { return this._info.gold; }
	set gold(g) { this._info.gold = g < 0 ? 0 : g; }

	get sex() { return this._info.sex; }
	set sex(s) { this._info.sex = s; }
	get weight() { return this._info.weight; }
	set weight(s) { this._info.weight = s; }
	get age() { return this._info.age; }
	set age(s) { this._info.age = s; }
	get height() { return this._info.height; }
	set height(s) { this._info.height = s; }

	get armor() { return this._curStats.armor; }
	set armor(v) { this._curStats.armor = v; }

	get str() { return this._curStats.str; }
	set str(v) { this._curStats.str = v; }
	get con() { return this._curStats.con; }

	set con(v) {

		this._curStats.con = v;
		this.computeHp();

	}

	get dex() { return this._curStats.dex; }
	set dex(v) { this._curStats.dex = v; }
	get int() { return this._curStats.int; }
	set int(v) { this._curStats.int = v; }
	get wis() { return this._curStats.wis; }
	set wis(v) { this._curStats.wis = v; }
	get cha() { return this._curStats.cha; }
	set cha(v) { this._curStats.cha = v; }

	get HD() { return this._charClass ? Math.floor((this._charClass.HD + this._race.HD) / 2) : this._race.HD; }

	get charClass() { return this._charClass }

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
	set info(v) { this._info = v; }

	get toHit() { return this.getModifier('dex'); }
	get loc() { return this._loc; }
	set loc(v) { this._loc.setTo(v); }

	private _name!: string;
	private readonly _loc: Coord;
	private _race: Race;
	private _info: any;
	private _baseStats: StatBlock;
	private _curStats: StatBlock;
	readonly effects: Effect[] = [];
	private _charClass?: CharClass;
	protected _talents?: string[];

	guild?: string;

	private _statMods: StatMod[];
	private _state: LifeState;

	constructor(race: Race, rpgClass?: CharClass) {

		this._baseStats = new StatBlock();
		this._curStats = new StatBlock();

		this._charClass = rpgClass;

		this._statMods = [];
		this._info = {};

		this._race = race;

		this._loc = new Coord(0, 0);

		this._state = 'alive';

	}

	/**
	 * Removes a gold amount or returns false.
	 * @param {number} amt
	 */
	payOrFail(amt: number) {

		if (amt > this.gold) return false;
		this.gold -= amt;
		return true;

	}

	statRoll(...stats: string[]) {
		let roll = this.skillRoll();
		for (let s of stats) {
			roll += this.getModifier(s);
		}
		return roll;

	}
	skillRoll() { return roll(1, 5 * (this._curStats.level + 4)); }

	levelUp() {

		this._baseStats.level += 1;
		this._curStats.level += 1;

		let hpBonus = this.HD + this._baseStats.getModifier('con');
		this._baseStats.addHp(hpBonus);
		this._curStats.addHp(hpBonus);

	}

	addEffect(e: Effect | ProtoEffect) {

		if (e instanceof ProtoEffect) {
			e = new Effect(e);
		}
		this.effects.push(e);
		e.start(this);

	}

	rmEffect(e: Effect | ProtoEffect) { }

	addGold(amt: number) { this._info.gold += amt; }

	/**
	 * @param stat
	 */
	getModifier(stat: string) { return this._curStats.getModifier(stat); }

	revive() {

		if (this.curHp <= 0) this.curHp = 1;
		this.state = exports.Alive;

	}

	getWeapons(): Weapon | Weapon[] | null { return null; }

	updateState() {
		if (this.curHp <= 0) this.state = exports.Dead;
		else this.state = exports.Alive;
		return this.state;
	}

	/**
	 * TODO: temp
	 */
	hit(amt: number) {
		this.curHp -= amt;
		if (this.curHp <= 0) {
			this.state = exports.Dead;
			return exports.Dead;
		}
	}

	hasTalent(s: string) {
		return this._talents?.includes(s);
	}

	/// TODO
	addItem(it: Item) { }
	randItem() { null; }
	takeItem(which: number | string | Item, sub?: number | string): any { return null; }

	/**
	 * Computes current, as opposed to base hp.
	*/
	computeHp() {

		let level = this._curStats.level;
		let hp = this._baseStats.maxHp + level * this.getModifier('con');

		if (hp < 1) hp = 1;
		this.maxHp = hp;

	}

	setBaseStats(base: StatBlock) {

		this._baseStats = base;

		Object.assign(this._curStats, base);

		this.applyRace();
		this.computeHp();

	}

	/**
	 * reroll hp.
	*/
	rollBaseHp() {

		let hd = this.HD;
		let maxHp = hd + this._baseStats.getModifier('con');

		for (let i = this._baseStats.level - 1; i > 0; i--) {
			maxHp += roll(1, hd);
		}

		this._baseStats.maxHp = maxHp;

	}

	applyRace() {

		if (!this._race) return;
		//if ( this._race.talents ) this._talents = this._race.talents.concat( this._talents );
		this.applyBaseMods(this._race.baseMods);

	}

	heal(amt: number) {
		let prev = this.curHp;
		this.curHp += amt;
		return (this.curHp - prev);
	}

	// recover hp without rest.
	recover() {
		let amt = Math.ceil(this.getModifier('con') + this.getModifier('wis') + this.level) / 2;
		if (amt < 1) amt = 1;
		return this.heal(amt);
	}

	rest() {
		let amt = this.getModifier('con') + this.getModifier('wis') + this.level;
		if (amt < 0) amt = 1;
		return this.heal(amt);
	}

	applyBaseMods(mods?: StatMod) {

		if (!mods) return;
		let stats = this._curStats;
		let mod;
		let val;

		for (let k in mods) {

			mod = mods[k as StatName];
			if (typeof (mod) === 'string') {
				mod = parseRoll(mod);
			}

			val = stats[k as StatKey];
			if (val) {

				val += mod;
				if (val < 3) val = 3;
				stats[k as StatKey] = val;

			}
			else stats[k as StatKey] = mod;

		}

	}

} //cls