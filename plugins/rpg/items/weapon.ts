import { Item, ItemType } from './item';
import Material from './material';
import { DamageSrc } from '../formulas';
const DamageSrc = require('../formulas.js').DamageSrc;

export default class Weapon extends Item {

	toJSON() {

		let json = super.toJSON();
		json.material = this._material;
		json.dmg = this.damage;
		json.hit = this.toHit;

		if (this.mods) json.mods = this.mods;

		return json;

	}

	static FromJSON(json: any) {

		let w = new Weapon(json.name, json.desc);

		if (json.material) w.material = json.material;

		if (json.mods) this.mods = json.mods;

		if (json.dmg) {
			//console.log( 'parsing weap damage.');
			w.damage = DamageSrc.FromJSON(json.dmg);
		} else {
			console.log('ERR: parsing weap dmg. no dmg.')
			w.damage = new DamageSrc(null, json.dmgType);
		}

		if (json.dmgType) w.dmgType = json.dmgType;

		w.toHit = json.hit || 0;

		return Item.FromJSON(json, w);

	}

	/**
	 * Create a new weapon from a base weapon object.
	 * @param {Object} tmp 
	 * @param {Material} mat 
	 */
	static FromData(tmp: any, mat = null) {

		if (!tmp) return null;

		let w = new Weapon(tmp.name);

		if (tmp.hands) w.hands = tmp.hands;
		if (tmp.mods) w._mods = Object.assign({}, tmp.mods);

		w.toHit = tmp.hit || 0;

		w.damage = DamageSrc.FromString(tmp.dmg, tmp.type);

		if (mat) {

			w.name = mat.name + ' ' + w.name;
			w.mat = mat.name;
			w.cost = mat.priceMod ? tmp.cost * mat.priceMod : tmp.cost;

			w.damage.bonus += mat.dmg || mat.bonus || 0;
		}

		return w;

	}

	set material(m) { this._material = m; }
	get material() { return this._material; }

	get toHit() { return this._toHit; }
	set toHit(v) { this._toHit = v; }

	get bonus() { return this.damage.bonus; }
	set bonus(v) { if (v < 0) v = 0; this.damage.bonus = v; }

	get mods() { return this._mods; }
	set mods(v) { this._mods = v; }

	get dmgType() { return this.damage.type; }

	private _toHit: number = 0;
	hands: number = 1;
	private _material?: Material;
	private _mods: any;
	damage: DamageSrc;

	constructor(name: string, desc?: string) {

		super(name, desc, ItemType.Weapon);
	}

	getDetails() {
		return `${this.name} dmg: ${this.damage} hitBonus: ${this.toHit} price: ${this.cost}\n` + super.getDetails();
	}

	/**
	 * roll weapon damage.
	*/
	roll() { return this.damage.roll(); }


}