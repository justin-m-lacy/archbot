import Wearable from "../items/wearable";
import { ItemType, Item } from '../items/item';
import { HumanSlot, toSlot } from '../items/wearable';
import Weapon from '../items/weapon';
import * as ItemGen from '../items/itemgen';

var MaxSlots: { [key: string]: number | undefined } = {
	neck: 3,
	fingers: 4
};

export type HumanSlots = {
	[key in HumanSlot]: Wearable | Wearable[] | null;
}

export default class Equip {

	static FromJSON(json: { slots?: Partial<HumanSlots> }) {

		let e = new Equip();
		let src = json.slots;
		let dest = e.slots;
		if (src == null) return e;

		let k: HumanSlot;
		for (k in src) {

			var wot = src[k];
			if (!wot) continue;
			else if (Array.isArray(wot)) {

				dest[k] = wot.map(ItemGen.fromJSON);

			} else dest[k] = ItemGen.fromJSON(wot);

		}

		return e;

	}

	readonly slots: HumanSlots = {
		head: null,
		hands: null,
		back: null,
		waist: null,
		neck: null,
		fingers: null,
		chest: null,
		legs: null,
		shins: null,
		feet: null,
		left: null,
		right: null
	};

	constructor() {
	}

	/**
	 * @returns string list of all equipped items.
	*/
	getList() {

		let list = '';

		let cur, slot: HumanSlot;
		for (slot in this.slots) {

			list += '\n' + slot + ': ';

			cur = this.slots[slot];
			if (cur == null) {
				list += 'nothing'
			} else if (Array.isArray(cur)) {

				list += Item.ItemList(cur);

			} else {
				list += cur.name;
			}

		}

		return list;

	}

	get(slot: HumanSlot) {

		if (!this.slots.hasOwnProperty(slot)) return null;
		return this.slots[slot];

	}

	getWeapons(): Weapon | Weapon[] | null {

		let right = this.slots.right as Weapon | null;
		let left = this.slots.left as Weapon | null;

		if (right === null) return left ? (left.type === ItemType.Weapon ? left as Weapon : null) : null;
		else if (left === null) return right.type === ItemType.Weapon ? right : null;

		if (right.type !== ItemType.Weapon) return left.type === ItemType.Weapon ? left : null;
		if (left.type !== ItemType.Weapon) return right.type === ItemType.Weapon ? right : null;

		return [left, right];

	}

	/**
	 *
	 * @param {Item} it
	 */
	remove(it: Wearable) {

		if (it.type === ItemType.Weapon) return this.removeWeap(it);

		let cur = this.slots[it.slot];

		if (Array.isArray(cur)) {

			for (let i = cur.length - 1; i >= 0; i--) {

				if (cur[i] == it) {
					cur.splice(i, 1);
					return true;
				}

			}

		} else {

			if (cur == it) {
				this.slots[it.slot] = null;
				return true;
			}

		}

		return false;

	}

	/**
	 * Remove item from slot and return it.
	 * @param {string} slot
	 */
	removeSlot(slot: string | HumanSlot | null | undefined) {

		const my = toSlot(slot);
		if (!my) return;


		let it = this.slots[my];
		if (!it) return;

		if (Array.isArray(it)) {
			if (it.length > 0) {
				it = it.shift()!;
			} else {
				return;
			}
		} else {
			this.slots[my] = null;
		}

		return it;

	}

	removeWeap(it: Wearable) {

		if (this.slots.right == it) this.slots.right = null;
		else if (this.slots.left == it) this.slots.left = null;

		return it;

	}

	equipWeap(it: Weapon) {

		console.log('equipping weapon...');

		let right = this.slots.right as Weapon;
		let left = this.slots.left as Weapon;

		if (it.hands === 2) {

			console.log('Setting two handed weapon.');
			this.slots.right = it;
			this.slots.left = null;

			if (right === null) return left;
			if (left === null) return right;
			return [left, right];

		} else {

			if (right === null) {

				console.log('setting right hand.');

				this.slots.right = it;
				if (left !== null && (left as Weapon).hands === 2) {
					this.slots.left = null;
					return left;
				}

			} else if (left === null) {

				console.log('setting left hand.');

				this.slots.left = it;
				if (right !== null && (right as Weapon).hands === 2) {
					this.slots.right = null;
					return right;
				}

			} else {

				console.log('passing off hands.');

				// can't both be two-handed.
				this.slots.right = it;
				this.slots.left = right;

				return left;

			}
			return null;

		}

	}

	/**
	 *
	 * @param {string} slot
	 * @param {Armor|Weapon} it
	 * @returns error string if slot does not exist, null if equip
	 * successful, old item if item replaces previous.
	 */
	equip(it: Wearable) {

		if (it.type === ItemType.Weapon) return this.equipWeap(it as Weapon);

		let slot = it.slot;
		if (slot === null || !this.slots.hasOwnProperty(slot)) return it.name + ' cannot be equipped.';

		let cur = this.slots[slot];
		if (Array.isArray(cur)) {

			cur.push(it);
			if (cur.length > (MaxSlots[slot] ?? 1)) cur = cur.shift()!;
			else cur = null;

		} else {

			if (!cur) {
				this.slots[slot] = it;
			} else {

				if (MaxSlots[slot] == null || MaxSlots[slot] === 1) {
					this.slots[slot] = it;
				} else {
					this.slots[slot] = [cur, it];
					cur = null;	// cur not replaced.
				}

			}

		}

		return cur;

	}

	/**
	 * Remove all items matching predicate, and returns them.
	 * @param {*} p - predicate
	 * @returns {Item[]}
	 */
	removeWhere(p: (v: Item) => boolean) {

		let v;
		let removed = [];

		let k: HumanSlot;
		for (k in this.slots) {

			v = this.slots[k];
			if (v === null || v === undefined) continue;

			if (Array.isArray(v)) {

				for (let i = v.length - 1; i >= 0; i--) {

					if (p(v[i])) {
						removed.push(v.splice(i, 1)[0]);
					}

				}

			} else if (p(v)) {

				this.slots[k] = null;
				removed.push(v);

			}

		}

		return removed;

	}

	forEach(f: (v: Wearable | null) => any) {

		let v;

		let k: HumanSlot
		for (k in this.slots) {

			v = this.slots[k];
			if (Array.isArray(v)) {

				for (let i = v.length - 1; i >= 0; i--) f(v[i]);

			} else f(v);

		}

	}

	* slotNames() {
		for (let k in this.slots) yield k;
	}

	* items() {

		let k: HumanSlot;
		for (k in this.slots) {
			const it = this.slots[k];
			if (it) yield it;
		}

	}

}