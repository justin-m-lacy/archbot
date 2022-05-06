import { Item } from "./item";

const itemjs = require('./item.js');
const effects = require('../magic/effects.js');
const forms = require('../formulas.js');
const Inv = require('../inventory.js');


module.exports = class Chest extends itemjs.Item {

	static FromJSON(json: any) {

		let p = new Chest();

		p.size = json.size;
		p.inv = Inv.FromJSON(json.inv, p.inv);

		return super.FromJSON(json, p);

	}

	toJSON() {

		let o = super.toJSON();

		o.size = this.size;
		o.inv = this._inv;

		return o;

	}

	get size() { return this._size; }
	set size(v) { this._size = v; }

	get inv() { return this._inv; }

	get lock() { return this._lock; }
	set lock(v) { this._lock = v; }

	get count() { return this._inv.length; }

	private readonly _inv = new Inv();

	constructor() {
		super('', '', 'chest');

	}

	takeRange(start: number, end: number) {
		return this._inv.takeRange(start, end);
	}

	getList() { return this._inv.getList(); }
	getMenu() { return this._inv.getMenu(); }

	getDetails() {
		return this._inv.getMenu() + '\n' + super.getDetails();
	}

	/**
	 * 
	 * @param {string|number} wot 
	 */
	get(wot: string | number) { return this._inv.get(wot); }

	/**
	 * 
	 * @param {number|string|Item} wot 
	 */
	take(wot: number | string | Item) { return this._inv.take(wot); }

	/**
	 * 
	 * @param {Item} it 
	 */
	add(it) {

		if (this.count < this.size) {
			this._inv.add(it);
		}
		return null;

	}

}