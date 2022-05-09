import { ItemType, Item } from './item';
import Material from './material';

const Slots: { [s: string]: boolean } = {
	'head': true,
	'hands': true,
	'back': true,
	'waist': true,
	'neck': true,
	'fingers': true,
	'chest': true,
	'legs': true,
	'shins': true,
	'feet': true,
	'left': true,
	'right': true,
}

export type HumanSlot = 'head' | 'hands' | 'back' | 'waist' | 'neck'
	| 'fingers' | 'chest' | 'legs' | 'shins' | 'feet' | 'left' | 'right';


export const toSlot = (slot: string) => {

	const s = slot.toLowerCase();
	if (Slots[s] === true) {
		return s as HumanSlot;
	}
	return null;
}

export default class Wearable extends Item {

	/**
	 * @property {number} armor - armor added. replace with defense?
	 */
	get armor() { return this._armor; }
	set armor(v) { this._armor = v < 0 ? 0 : v }

	/**
	 * @property {string} slot - equip slot used.
	 */
	get slot() { return this._slot; }
	set slot(v) { this._slot = v; }

	/**
	 * @property {string} material - armor material.
	 */
	get material() { return this._material; }
	set material(m) { this._material = m; }

	get mods() { return this._mods; }
	set mods(v) { this._mods = v; }

	/**
	 * From template data.
	 * @param {*} base
	 * @param {*} material
	 */
	static FromData(base: any, material: Material) {

		let name = material.name + ' ' + base.name;
		let it = new Wearable(name);

		it.material = material.name;
		it.cost = material.priceMod ? base.cost * material.priceMod : base.cost;

		it.armor = material.bonus ? base.armor + material.bonus : base.armor;
		it.slot = base.slot;

		if (base.mods) it.mods = Object.assign({}, base.mods);

		return it;
	}

	static FromJSON(json: any) {

		let a = new Wearable(json.name, json.desc);
		a.material = json.material;
		a.slot = json.slot;
		a.armor = json.armor;

		if (json.mods) a.mods = json.mods;

		return Item.FromJSON(json, a);
	}

	toJSON() {

		let json = super.toJSON();

		json.armor = this._armor;
		json.slot = this._slot;
		json.material = this._material;
		if (this._mods) json.mods = this._mods;

		return json;

	}

	private _armor: number;
	private _slot!: HumanSlot;
	private _material: string = '';
	private _mods: any;

	constructor(name: string, desc?: string) {

		super(name, desc, ItemType.Armor);
		this._armor = 0;

	}

	getDetails() {
		return this.name + '\t armor: ' + this.armor + '\t price: ' + this.cost + '\n' + super.getDetails();
	}


}