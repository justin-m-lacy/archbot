import { Item, ItemType } from "./item";
import Inventory from '../inventory';

export default class Chest extends Item {

	static FromJSON(json: any) {

		const p = new Chest(Inventory.FromJSON(json.inv));
		p.size = json.size;

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

	private _size: number = 0;
	private _lock: number = 0;

	private readonly _inv;

	constructor(inv: Inventory) {
		super('', '', ItemType.Chest);

		this._inv = inv;

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
	add(it: Item) {

		if (this.count < this.size) {
			this._inv.add(it);
		}
		return null;

	}

}