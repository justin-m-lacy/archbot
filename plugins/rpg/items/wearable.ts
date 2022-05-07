import { ItemType } from './item';
import Material from './material';
const Item = require('./item.js');

export type HumanSlot = 'head' | 'hands' | 'back' | 'waist' | 'neck'
	| 'fingers' | 'chest' | 'legs' | 'shins' | 'feet' | 'left' | 'right'

export default class Wearable extends Item.Item {

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
		let armor = new Wearable(name);

		armor.material = material.name;
		armor.cost = material.priceMod ? base.cost * material.priceMod : base.cost;

		armor.armor = material.bonus ? base.armor + material.bonus : base.armor;
		armor.slot = base.slot;

		if (base.mods) this.mods = Object.assign({}, base.mods);

		return armor;
	}

	static FromJSON(json: any) {

		let a = new Wearable(json.name, json.desc);
		a.material = json.material;
		a.slot = json.slot;
		a.armor = json.armor;

		if (json.mods) this.mods = json.mods;

		return Item.Item.FromJSON(json, a);
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

	constructor(name: string, desc?: string) {

		super(name, desc, ItemType.Armor);
		this._armor = 0;

	}

	getDetails() {
		return this._name + '\t armor: ' + this.armor + '\t price: ' + this.cost + '\n' + super.getDetails();
	}


}