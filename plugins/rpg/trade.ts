import Char from "./char/char";
import { ItemPicker, ItemIndex } from './inventory';
import { Item } from './items/item';
import Wearable from './items/wearable';

const util = require('../../jsutils.js');
const Material = require('./items/material.js');

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

const rollWeap = (char: Char) => {

	let level = char.level;
	let cost = rollCost(level);
	if (!char.payOrFail(cost))
		return `${char.name} cannot afford to roll a new weapon. (${cost} gold)`;

	let gen = require('./items/itemgen.js');
	let mod = 1 + char.getModifier('cha');
	if (mod < 0) mod = 0;

	level = Math.max(0, level + util.random(-1, mod));
	let it = gen.genWeapon(level);

	if (!it) return 'Failed to roll a weapon.';

	let ind = char.addItem(it);
	return `${char.name} rolled a shiny new ${it.name}. (${ind})`;

}

exports.rollArmor = (char: Char, slot: string) => {

	let level = char.level;
	let cost = rollCost(level);
	if (!char.payOrFail(cost))
		return `${char.name} cannot afford to roll new armor. (${cost} gold)`;

	let gen = require('./items/itemgen.js');

	let mod = 1 + char.getModifier('cha');
	if (mod < 0) mod = 0;

	level = Math.max(0, level + util.random(-1, mod));
	let it = gen.genArmor(slot, level);

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

	if (end !== null) return sellRange(src, wot, end);

	let it = src.takeItem(wot);
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
		let it = src.takeItem(what);
		if (it) {

			let ind = dest.addItem(it);
			src.addHistory('gave');
			dest.addHistory('recieved');

			return (it.name) ? `Gave ${dest.name} ${it.name}. (${ind})` : 'Transfer complete.';

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

	return true;

}

export const nerfItems = (char: Char) => {

	let maxLevel = char.level + 1;

	let test = (it: Wearable) => {

		if (!it) return false;

		if (it.level && it.level > maxLevel) return true;
		if (it.material) {

			let m = Material.GetMaterial(it.material);
			if (m && m.level > maxLevel) return true;

		}

		return false;
	};

	let removed = char.inv.removeWhere(test);
	removed = removed.concat(char.removeWhere(test)).map((it: Item) => it.name);

	return 'Removed Items: ' + removed.join(', ');

}