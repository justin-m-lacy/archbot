import { Item, ItemType } from '../items/item';
import { HumanSlot } from '../items/wearable';
import Equip from './equip';
import Inventory from '../inventory';
import { ItemPicker, ItemIndex } from '../inventory';
import { roll } from '../dice';
import Actor from './actor';
import Race from './race';
import CharClass from './charclass';
import { Log } from '../display';
import { Coord } from '../world/loc';
import { History } from '../display/history';
import { getNextExp, tryLevel } from './level';
import Wearable from '../items/wearable';
import StatBlock, { getEvil } from './stats';
import { Effect } from '../magic/effects';
import { StatKey } from './stats';

const statTypes = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const saveProps = ['name', 'exp', 'owner', 'state', 'info', 'baseStats', 'effects',
	'loc', 'history', 'statPoints', 'spentPoints', 'guild', 'inv', 'talents'];


export default class Char extends Actor {

	get owner() { return this._owner; }
	set owner(v) { this._owner = v; }

	/**
	 * TODO: not yet implemented.
	 * get id() { return this._id; }
	set id(v) { this._id = v; }
	**/

	get exp() { return this._exp; }
	set exp(v) { this._exp = v; }

	get inv() { return this._inv; }

	getEquips() { return this._equip; }

	get home() { return this._home; }
	set home(v) { this._home = v; }

	get history() { return this._history; }
	set history(v) { this._history = v; }

	get statPoints() { return this._statPoints; }
	set statPoints(v) { this._statPoints = v; }

	get spentPoints() { return this._spentPoints; }
	set spentPoints(v) { this._spentPoints = v; }

	get skills() { return this._skills; }
	set skills(v) { this._skills = v; }

	get skillPts() { return this._skillPts; }
	set skillPts(v) { this._skillPts = v; }

	get evil() { return this.baseStats.evil; }
	set evil(v) { this.baseStats.evil = v; }

	get talents() { return this._talents; }
	set talents(v) { this._talents = v; }

	/**
	 * Notification for level up.
	 * TODO: replace with event system.
	 */
	get levelFlag() { return this._levelUp; }
	set levelFlag(b) { this._levelUp = b; }

	toJSON() {

		let json: any = {};
		for (let i = saveProps.length - 1; i >= 0; i--) {

			var p = saveProps[i];
			json[p] = this[p as keyof Char];

		}

		if (this._home) json.home = this._home;

		json.equip = this._equip;

		json.race = this.race.name;
		json.charClass = this.charClass?.name;

		return json;
	}

	static FromJSON(json: any) {

		if (!json) return null;

		let char = new Char(
			Race.RandRace(json.race),
			CharClass.RandClass(json.charClass),
			json.owner);

		char.name = json.name;
		char.exp = Math.floor(json.exp) || 0;
		char.evil = json.evil || 0;

		char.guild = json.guild;

		if (json.talents) char.talents = json.talents;
		if (json.history) Object.assign(char.history, json.history);
		if (json.home) char._home = new Coord(json.home.x, json.home.y);

		if (json.baseStats) Object.assign(char.baseStats, json.baseStats);
		if (json.info) Object.assign(char.info, json.info);
		if (json.loc) Object.assign(char.loc, json.loc);

		if (json.state) char.state = json.state;

		char.statPoints = json.statPoints || char.baseStats.level;
		char.spentPoints = json.spentPoints || 0;

		if (json.inv) Inventory.FromJSON(json.inv, char._inv);

		char.setBaseStats(char.baseStats);

		// SET AFTER BASE STATS.
		if (json.effects) {
			let a = json.effects;
			for (let i = a.length - 1; i >= 0; i--) {

				let effect = Effect.FromJSON(a[i]);
				if (effect) {
					char.addEffect(effect);
				}

			}
		}

		if (json.equip) char.setEquip(Equip.FromJSON(json.equip));

		return char;

	}

	private readonly _inv: Inventory;
	private _equip: Equip;
	private _statPoints: number;
	private _spentPoints: number;
	private _skillPts: number = 0;
	private _owner: string;
	private _exp: number = 0;
	private readonly _log: Log;
	private _home?: Coord;
	private _skills: any;
	// TODO: replace with events.
	private _levelUp: boolean = false;
	private _history: History;

	constructor(race: Race, charclass: CharClass, owner: string) {

		super(race, charclass);

		this._statPoints = 0;
		this._spentPoints = 0;

		this._inv = new Inventory();
		this._equip = new Equip();

		this._history = { explored: 0, crafted: 0 };

		this._log = new Log();

		this._owner = owner;

	}

	/**
	 * Add a single point to the given stat.
	 * @param {string} stat
	 * @returns {string|bool} error message, or true.
	 */
	addStat(stat: string) {

		stat = stat.toLowerCase();
		if (statTypes.indexOf(stat) < 0) return 'Stat not found.';
		if (this._spentPoints >= this._statPoints) return 'No stat points available.';

		if (stat in this.baseStats) {
			this.baseStats[stat as keyof StatBlock]++;
			this.curStats[stat as keyof StatBlock]++;
		}

		this._spentPoints++;

		return true;

	}

	hasTalent(t: string) {
		return (this._talents?.includes(t)) || this.charClass!.hasTalent(t) || this.race.hasTalent(t);
	}

	addHistory(evt: string) {
		let v = this._history[evt] || 0;
		this._history[evt] = v + 1;
	}

	levelUp() {

		super.levelUp();
		this._levelUp = true;
		this._statPoints++;

	}

	addExp(amt: number) {
		this.exp += amt;
		return tryLevel(this);
	}

	/**
	 * Eat an item from inventory.
	 * @param {number|string|Item} what
	 * @returns {string} result message.
	 */
	eat(what: ItemIndex) {

		let item = this._inv.get(what);
		if (!item) return 'Item not found.';

		if (item.type !== ItemType.Food) return item.name + ' isn\'t food!';

		this._inv.take(item);

		let cook = require('../data/cooking.json');
		this.addHistory('eat');

		let resp = cook.response[Math.floor(cook.response.length * Math.random())];

		let amt = this.heal(Math.floor(5 * Math.random()) + this.level);

		resp = `You eat the ${item.name}. ${resp}.`;
		if (amt > 0) resp += ` ${amt} hp healed. ${this.curHp}/${this.maxHp} total.`;

		return resp;
	}

	/**
	 *
	 * @param {Item|number|string} what - what to cook.
	 */
	cook(what: ItemPicker) {

		let item = what instanceof Item ? what : this._inv.get(what);
		if (!item) return 'Item not found.';

		if (item.type === ItemType.Food) return item.name + ' is already food.';

		this.addHistory('cook');
		Item.Cook(item);
		return `${this.name} cooks '${item.name}'`;

	}

	/**
	 *
	 * @param {number|string|Item} what
	 * @returns {bool|string} Error message or true.
	 */
	equip(what: ItemIndex) {

		let item = this._inv.get(what);
		if (!item) return 'No such item.';

		if (item instanceof Wearable) {

			let removed = this._equip.equip(item);
			if (typeof (removed) !== 'string') {

				this.applyEquip(item);
				this._inv.take(item);
				if (removed) {
					this.removeEquip(removed);
					this._inv.add(removed);
				}

				return true;

			}
			return removed;
		} else {
			return 'Item cannot be equipped.'
		}

	}

	/**
	 * Removes any items matching the predicate and returns them.
	 * Removed items are not added to inventory.
	 * @param {function} p
	 */
	removeWhere(p: (w: Item) => boolean) {

		const equips = this._equip.removeWhere(p);
		this.removeEquip(equips);
		return this.inv.removeWhere(p).concat(equips);
	}

	unequip(slot?: string) {

		let removed = this._equip.removeSlot(slot);
		if (!removed) return;

		this.removeEquip(removed);
		this._inv.add(removed);

		return removed;

	}

	setEquip(e: Equip) {

		this._equip = e;
		for (let it of e.items()) {

			if (Array.isArray(it)) {
				it.forEach(it => this.applyEquip(it));
			}
			else this.applyEquip(it);

		}
		console.log(this.name + ' armor: ' + this.armor);

	}

	applyEquip(it: Wearable) {
		if (it.mods) {
			it.mods.apply(this.curStats);
		}
		if (it.armor) {
			this.curStats.armor += it.armor;
			//console.log('adding armor: ' + it.armor);
		}
	}

	/**
	 *
	 * @param {Item|Item[]} wot
	 */
	removeEquip(wot: Item | Item[]) {

		if (Array.isArray(wot)) {

			let it;
			for (let i = wot.length - 1; i >= 0; i--) {
				this.removeEquip(wot[i]);
			}

		} else if (wot instanceof Wearable) {

			if (wot.mods) { wot.mods.remove(this.curStats); }
			if (wot.armor) this.curStats.armor -= wot.armor;
		}

	}

	/**
	 * Returns the item in the given equipment slot.
	 * @param {Item} slot
	 */
	getEquip(slot: HumanSlot) { return this._equip.get(slot); }

	listEquip() { return this._equip.getList(); }

	/**
	 * Removes and returns a random item, or null.
	 */
	randItem() { return this._inv.randItem(); }

	/**
	 * Get an item from inventory without removing it.
	 * @param {number|string|Item} which
	 */
	getItem(which: number | string, sub?: number | string) {
		return this._inv.getSub(which, sub);
	}

	/**
	 * Add an item to inventory.
	 * @param {Item|Item[]} it
	 */
	addItem(it?: Item | (Item | null | undefined)[] | null) {
		return this._inv.add(it);

	}

	/**
	 * Remove an item from inventory and return it.
	 * @param {number|string|Item} which
	 * @returns {Item} Item removed or null.
	 */
	takeItem(which: number | string | Item, sub?: number | string) {
		return this._inv.take(which, sub);
	}

	takeRange(start: ItemIndex, end: ItemIndex) { return this._inv.takeRange(start, end); }

	/**
	 * reroll hp.
	*/
	rollBaseHp() {

		let hd = this.charClass!.HD;
		let maxHp = Math.floor((this.race.HD + hd) / 2);

		for (let i = this.baseStats.level - 1; i > 0; i--) {
			maxHp += roll(1, hd);
		}

		this.baseStats.maxHp = maxHp;

	}

	setBaseStats(base: StatBlock) {

		super.setBaseStats(base);
		this.applyClass();
		this.computeHp();

	}


	applyClass() {

		if (!this.charClass) return;
		//if ( this._charClass.talents ) this.talents = this._charClass.talents.concat( this._talents );

		super.applyBaseMods(this.charClass!.baseMods);

	}

	getTalents() {

		let s = new Set(this._talents);
		if (this.charClass?.talents) this.charClass.talents.forEach((v: string) => s.add(v));
		if (this.race.talents) this.race.talents.forEach((v: string) => s.add(v));

		if (s.size === 0) return `${this.name} has no talents.`;

		let res = this.name + "'s Talents:";
		for (let t of s) res += '\n' + t;

		return res;

	}

	getWeapons() { return this._equip.getWeapons(); }

	testDmg() {

		let weaps = this._equip.getWeapons();
		if (weaps === null) return 'No weapons equipped.';
		else if (Array.isArray(weaps)) {

			let res = '';
			for (let i = weaps.length - 1; i >= 0; i--) {
				res += weaps[i].name + ' rolled: ' + weaps[i].roll() + '\n';
			}
			return res;

		} else return weaps.name + ' rolled: ' + weaps.roll();

	}

	getLongDesc() {

		let desc = `level ${this.level} ${getEvil(this.evil)} ${this.race.name} ${this.charClass!.name} [${this.state}]`;
		desc += `\nage: ${this.age} sex: ${this.sex} gold: ${this.gold} exp: ${this._exp}/ ${getNextExp(this)}`;
		desc += `\nhp: ${this.curHp}/${this.maxHp} armor: ${this.armor}\n`;
		desc += this.getStatString();

		if (this.spentPoints < this.statPoints) desc += '\n' + (this.statPoints - this.spentPoints) + ' stat points available.';

		return desc;

	}

	getStatString() {

		let str = '';
		let len = statTypes.length;

		let stat = statTypes[0];
		str += stat + ': ' + (this.curStats[stat as StatKey] ?? 0);

		for (let i = 1; i < len; i++) {

			stat = statTypes[i];
			str += '\n' + stat + ': ' + (this.curStats[stat as StatKey] ?? 0);

		}
		return str;

	}

	log(str: string) { this._log.log(str); }
	getLog() { return this._log.text; }
	output(str = '') { return this._log.output(str); }

	clearLog() { this._log.clear(); }

	getHistory() {

		let resp = (this._history.explored || 0) + ' locations discovered.\n';
		resp += (this._history.crafted || 0) + ' items crafted.\n';
		resp += (this._history.slay || 0) + ' monsters slain.\n';
		resp += (this._history.pk || 0) + ' players killed.\n';
		resp += (this.history.stolen || 0) + ' items stolen.\n'
		resp += (this._history.cook || 0) + ' objects cooked.\n';
		resp += (this._history.inscribe || 0) + ' items inscribed.\n';
		resp += (this._history.eat || 0) + ' things eaten.\n';
		resp += (this._history.quaff || 0) + ' potions quaffed.\n';
		resp += (this._history.brew || 0) + ' potions brewed.';

		return resp;

	}

}