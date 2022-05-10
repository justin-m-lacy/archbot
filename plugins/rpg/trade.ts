import Char from "./char/char";
import { ItemPicker, ItemIndex } from './inventory';
import { Item } from './items/item';
import Wearable from './items/wearable';
import * as ItemGen from './items/itemgen';
import { toSlot } from './items/wearable';
import * as jsutils from '../../src/jsutils';

const Material = require('./items/material');

/**
 * @const {RegExp} isGold - Regexp testing for a gold amount.
 */
const goldAmt = /^(\d+)\s*g(?:old)?$/i;

/**
 *
 * @param {*} lvl
 * @returns {number} item cost per level.
 */
const rollCost = (lvl: number) => {
	return 40 * lvl * (Math.floor(Math.pow(1.5, Math.floor(lvl / 2))));
}

export const rollWeap = (char: Char) => {

	let level = char.level;
	let cost = rollCost(level);
	if (!char.payOrFail(cost))
		return `${char.name} cannot afford to roll a new weapon. (${cost} gold)`;

	let gen = require('./items/itemgen');
	let mod = 1 + char.getModifier('cha');
	if (mod < 0) mod = 0;

	level = Math.max(0, level + jsutils.random(-1, mod));
	let it = gen.genWeapon(level);

	if (!it) return 'Failed to roll a weapon.';

	let ind = char.addItem(it);
	return `${char.name} rolled a shiny new ${it.name}. (${ind})`;

}

export const rollArmor = (char: Char, slot?: string) => {

	let level = char.level;
	let cost = rollCost(level);
	if (!char.payOrFail(cost))
		return `${char.name} cannot afford to roll new armor. (${cost} gold)`;

	let mod = 1 + char.getModifier('cha');
	if (mod < 0) mod = 0;

	level = Math.max(0, level + jsutils.random(-1, mod));
	let it = ItemGen.genArmor(toSlot(slot), level);

	if (!it) return 'Failed to roll armor.';

	let ind = char.addItem(it);

	return `${char.name} rolled a spiffy new ${it.name}. (${ind})`;

}

export const sellRange = (src: Char, start: number, end: number) => {

	let arr = src.takeRange(start, end);
	if (arr === null) return 'Invalid item range.';
	if (arr.length === 0) return 'No items in range.';

	let mod = src.level + src.getModifier('cha');
	if (mod < 0) mod = 0;

	let gold = 0;

	for (let i = arr.length - 1; i >= 0; i--) {
		gold += isNaN(arr[i].cost) ? (Math.random() < 0.5 ? mod : 0) : arr[i].cost + mod;
	}

	src.addGold(gold);

	return arr.length + ' items sold for ' + gold + ' gold.';

}

export const sell = (src: Char, wot: ItemPicker, end?: ItemIndex) => {

	// @ts-ignore
	if (end !== null) return sellRange(src, wot as ItemIndex, end);

	let it = src.takeItem(wot) as Item | null;
	if (!it) return 'Item not found.';

	let mod = src.level + src.getModifier('cha');
	if (mod < 0) mod = 0;

	let gold = isNaN(it.cost) ? (Math.random() < 0.5 ? mod : 0) : it.cost + mod;
	src.addGold(gold);
	return it.name + ' sold for ' + gold + ' gold.';

}

export const transfer = (src: Char, dest: Char, what: string) => {

	let res = goldAmt.exec(what);
	if (res !== null) {

		console.log('gold transfer: ' + res[1]);
		return xferGold(src, dest, res[1]);

	} else {

		console.log('item transfer: ' + what);
		let it = src.takeItem(what) as Item | null;
		if (it) {

			let ind = dest.addItem(it);
			src.addHistory('gave');
			dest.addHistory('recieved');

			return (it.name) ? `Gave ${dest.name} ${it.name}. (${ind})` : `Gave ${dest.name} the item.`;

		}
	}

	return "Item not found.";

}

const xferGold = (src: Char, dest: Char, count: number | string) => {

	if (typeof (count) === 'string') count = parseInt(count);
	if (isNaN(count)) return 'Amount is not a number.';

	let gold = src.gold;

	if (gold < count) return "Not enough gold.";

	gold -= count;
	src.gold = gold;
	dest.addGold(count);

	return `Gave ${dest.name} ${count} gold.`;

}

export const nerfItems = (char: Char) => {

	const maxLevel = char.level + 1;

	const test = (it: Item) => {

		if (!it || !(it instanceof Wearable)) return false;

		if (it.level && it.level > maxLevel) return true;
		if (it.material) {

			let m = Material.GetMaterial(it.material);
			if (m && m.level > maxLevel) return true;

		}

		return false;
	};

	const removed = char.removeWhere(test);
	return 'Removed Items: ' + removed.map(it => it.name).join(', ');

}