import Char from "../char/char";

export enum ItemType {

	Weapon = 'weapon',
	Armor = 'armor',
	Potion = 'potion',
	Food = 'food',
	Drink = 'drink',
	Scroll = 'scroll',
	Unique = 'unique',
	Chest = 'chest',
	Feature = 'feature',
	Grave = 'grave',
	Unknown = 'unknown'
}

export type ItemData = {
	name: string,
	type: ItemType,
	desc?: string,
	cost?: number,
	crafter?: string,
	inscrip?: string,
	level?: number,
	created?: number,
	/// file/image attachment
	attach?: string
}

export class Item {

	/**
	 * @property {string} name
	 */
	get name() { return this._name; }
	set name(v) { this._name = v; }

	/**
	 * @property {string} type
	 */
	get type() { return this._type; }
	set type(v) { this._type = v; }

	get cost() { return this._cost; }
	set cost(v) { this._cost = v; }

	get desc() { return this._desc; }
	set desc(v) { this._desc = v; }

	/**
	 * @property {string} inscription
	 */
	get inscription() { return this._inscript; }
	set inscription(v) { this._inscript = v; }

	get level() { return this._level; }
	set level(v) { this._level = v; }

	get attach() { return this._attach; }
	set attach(v) { this._attach = v; }

	/**
	 * @returns {string} discord id of crafter.
	 */
	get crafter() { return this._crafter; }
	set crafter(s) { this._crafter = s; }

	/**
	 * @property {number} time - creation timestamp.
	 */
	get created() { return this._created; }
	set created(t) { this._created = t; }



	/**
	 * Since Item is subclassed, the sub item created
	 * is passed as a param.
	 * @param {Object} json
	 * @param {Item} it
	 */
	static FromJSON(json: ItemData, it?: Item) {

		if (!it) it = new Item(json.name, json.desc, json.type);
		else {
			it.name = json.name;
		}

		if (json.cost) it._cost = json.cost;
		if (json.attach) it._attach = json.attach;
		if (json.crafter) it._crafter = json.crafter;
		if (json.inscrip) it._inscript = json.inscrip;

		if (json.level && !isNaN(json.level)) {
			it._level = json.level;
		}

		return it;

	}

	toJSON() {

		const json: any = {
			name: this._name,
			desc: this._desc,
			type: this._type,
			cost: this._cost
		}

		if (this._level) json.level = this._level;
		if (this._attach) json.attach = this._attach;
		if (this._crafter) json.maker = this._crafter;
		if (this._inscript) json.inscrip = this._inscript;

		return json;

	}

	private _name: string;
	private _type: string;
	private _desc: string;
	private _level: number = 0;
	private _inscript?: string;

	private _crafter?: string;
	/// image attachment
	private _attach?: string;
	private _cost: number = 0;

	/**
	 * item creation time.
	 */
	private _created: number = 0;

	constructor(name: string, desc: string = '', type: ItemType = ItemType.Unknown) {

		this._name = name;
		this._type = type;
		this._desc = desc;

	}

	getView():[string,string|undefined] {
		return [this.getDetails(false), this._attach];
	}

	/**
	 * @returns {string} detailed string description of item.
	*/
	getDetails(imgTag = true) {

		let s = this._name;
		if (this._desc) s += ': ' + this._desc;
		if (this._inscript) s += ' { ' + this._inscript + ' }';
		if (this._attach && imgTag) s += ' [img]';
		if (this._crafter) s += '\ncreated by ' + this._crafter;

		return s;
	}

	toString() { return this._name }

	static ItemMenu(a: Item[], start = 1) {

		const len = a.length;
		if (len === 0) return 'nothing';
		else if (len === 1) return (start) + ') ' + a[0]._name + (a[0].attach ? '\t[img]' : '');

		let it = a[0];
		let res = (start++) + ') ' + it._name;
		if (it.attach) res += '\t[img]';

		for (let i = 1; i < len; i++) {

			it = a[i];
			res += '\n' + (start++) + ') ' + it._name;
			if (it.attach) res += '\t[img]';
		}

		return res;

	}

	/**
	 *
	 * @param {Item[]} a
	 */
	static DetailsList(a: Item[]) {

		if (a.length === 0) return 'nothing';
		return a.map(it=>it.getDetails()).join(",");
	
	}

	/**
	 *
	 * @param {Item[]} a
	 */
	static ItemList(a: Item[]) {

		if (a.length === 0) return 'nothing';
		return a.map(it=>it._name + (it.attach?'\t[img]' : '')).join(',');
	
	}

	static Cook(it: Item) {

		const cooking = require('../data/cooking.json');
		const adjs = cooking.adjectives;

		const adj = adjs[Math.floor(adjs.length * Math.random())];

		if ('armor' in it) {
			// @ts-ignore
			it.armor -= 10;
		} else if ('bonus' in it) {
			// @ts-ignore
			it.bonus -= 10;
		}
		it.type = exports.FOOD;

		it.name = adj + ' ' + it.name;

		const desc = cooking.descs[Math.floor(cooking.descs.length * Math.random())];
		it.desc += ' ' + desc;

	}

}

export const Craft = (char: Char, name: string, desc?: string, attach?: string) => {

	const item = new Item(name, desc);

	if (attach) item.attach = attach;

	item.crafter = char.name;
	item.created = Date.now();

	const maxBonus = Math.max(char.level + char.getModifier('int') + 1, 2);
	item.cost = Math.floor(maxBonus * Math.random());

	char.addHistory('crafted');
	char.addExp(2);
	return char.addItem(item);

}