import { ItemType, Item } from './item';
import Feature from '../world/feature';
import Potion from './potion';
import { HumanSlot } from './wearable';
import Wearable from './wearable';
import Monster from '../monster/monster';
import { Loot } from '../combat/loot';
import Material from './material';
import Weapon from './weapon';
import Grave from './grave';
import Chest from './chest';

const allItems: { [str: string]: Item } = {};
let allPots: { [name: string]: Potion };
let potsByLevel: { [key: number]: Potion[] };

let miscItems: Item[];
let featureByName: { [key: string]: Feature };
let featureList: Feature[];

let baseWeapons = require('../data/items/weapons.json');
let baseArmors = require('../data/items/armors.json');
let armorBySlot: Partial<{ [Property in HumanSlot]: Wearable[] }>;

initItems();
initArmors();
initPots();
initScrolls();
initChests();

initFeatures();

Material.LoadMaterials();

function initItems() {

	var items = require('../data/items/items.json');
	var spec = items.special;

	miscItems = items.misc;

	for (let i = miscItems.length - 1; i >= 0; i--) {
		allItems[miscItems[i].name.toLowerCase()] = miscItems[i];
	}

	for (let i = spec.length - 1; i >= 0; i--) {
		allItems[spec[i].name.toLowerCase()] = spec[i];
	}

}

function initPots() {

	allPots = {};
	potsByLevel = [];

	let pots = require('../data/items/potions.json');

	let p, name, a;
	for (let i = pots.length - 1; i >= 0; i--) {

		p = pots[i];
		p.type = ItemType.Potion;	// assign type.

		name = p.name.toLowerCase();
		allItems[name] = allPots[name] = p;

		a = potsByLevel[p.level];
		if (!a) potsByLevel[p.level] = a = [];
		a.push(p);

	}

}

function initChests() {

	let packs = require('../data/items/chests.json');

	let p, name, a;
	for (let i = packs.length - 1; i >= 0; i--) {

		p = packs[i];
		p.type = 'chest';	// assign type.

		name = p.name.toLowerCase();
		allItems[name] = p;

	}

}

function initScrolls() {
}

function initArmors() {

	armorBySlot = {};

	let armor, slot, list;
	for (let k = baseArmors.length - 1; k >= 0; k--) {

		armor = baseArmors[k];
		slot = armor.slot as HumanSlot;

		list = armorBySlot[slot];
		if (!list) list = armorBySlot[slot] = [];

		list.push(armor);

	}

}

/**
 * revive an item from JSON
*/
export const fromJSON = (json: any) => {

	if (!json) return null;

	switch (json.type) {
		case ItemType.Armor:
			return Wearable.FromJSON(json);

		case ItemType.Weapon:
			return Weapon.FromJSON(json);

		case ItemType.Potion:
			return Potion.FromJSON(json);

		case 'feature':
			return Feature.FromJSON(json);

		case 'grave':
			return Grave.FromJSON(json);

		case 'chest':
			return Chest.FromJSON(json);

		default:
			return Item.FromJSON(json);
	}

}

export const genPot = (name: string) => {

	const pot = allPots[name];
	return pot ? Potion.FromJSON(pot) : null;

}

export const genWeapon = (lvl: number) => {

	const mat = Material.Random(lvl);
	if (mat === null) { console.log('material is null'); return null; }

	//console.log( 'weaps len: ' + baseWeapons.length );
	let tmp = baseWeapons[Math.floor(baseWeapons.length * Math.random())];

	if (!tmp) {
		console.log('weapon template is null.');
		return null;
	}

	return Weapon.FromData(tmp, mat);

}

export const genArmor = (slot: HumanSlot | null = null, lvl: number = 0) => {

	let mat = Material.Random(lvl);
	if (mat === null) { console.log('material is null'); return null; }

	let tmp;
	if (slot) {
		tmp = getSlotRand(slot, lvl);
	} else {
		let list = baseArmors.filter((t: Wearable) => !t.level || t.level <= lvl);
		tmp = list[Math.floor(list.length * Math.random())];
	}

	if (!tmp) return;

	return Wearable.FromData(tmp, mat);

}

const getSlotRand = (slot: HumanSlot, lvl: number = 0) => {

	let list = armorBySlot[slot];
	if (!list) return;
	list = list.filter(t => !t.level || t.level <= lvl);
	return list[Math.floor(list.length * Math.random())];

}

export const randFeature = () => {

	let data = featureList[Math.floor(featureList.length * Math.random())];
	return Feature.FromJSON(data);

}

export const genLoot = (mons: Monster) => {

	let lvl = Math.floor(mons.level);

	let loot: Loot = {
		items: [

		],
		gold: Math.random() < 0.5 ? Math.floor(20 * lvl * Math.random() + 0.1) : 0

	};

	if (Math.random() < 0.2) {
		const armor = genArmor(null, lvl);
		if (armor) loot.items!.push(armor);
	}
	if (Math.random() < 0.1) {
		const weap = genWeapon(lvl);
		if (weap) {
			loot.items!.push(weap);
		}
	}

	if (mons.drops) {
		console.log('GETTING MONS DROPS.');
		let itms = getDrops(mons);
		if (itms) loot.items = loot.items!.concat(itms);
	}


	return loot;

}

const getDrops = (mons: Monster) => {

	let drops = mons.drops;
	if (!drops) return;

	if (Array.isArray(drops)) {

		let it = drops[Math.floor(Math.random() * drops.length)];
		return procItem(it);

	} else if (typeof (drops) === 'string') {

		return Math.random() < 0.7 ? procItem(drops) : null;

	} else {

		let it, itms = [];
		for (let k in drops) {

			if (100 * Math.random() < drops[k]) {
				it = procItem(k);
				if (it) itms.push(it);
				else console.log('item not found: ' + k);
			}

		}
		return itms;

	}

}

const procItem = (name: string) => {

	let data = allItems[name];
	if (!data) return null;

	return fromJSON(data);

}

/**
 * Returns a useless item.
 */
export const getMiscItem = () => {

	let it = miscItems[Math.floor(miscItems.length * Math.random())];
	return fromJSON(it);

}

/**
 * Create named feature from data.
 * @param {string} s
 */
const getFeature = (s: string) => {
	let d = featureByName[s];
	if (d) return Feature.FromJSON(d);
	return null;
}

function initFeatures() {

	//console.log('INIT FEATURES');
	featureList = require('../data/world/features.json');
	featureByName = {};

	for (let i = featureList.length - 1; i >= 0; i--) {
		featureByName[featureList[i].name] = featureList[i];
	}
	//console.log('INIT FEATURES DONE');

}

export const potsList = (level: number) => {

	let a = potsByLevel[level];
	if (!a) return 'No potions of level ' + level + '.';

	let len = a.length;
	//let p = a[0];
	let s = `${a[0].name}`;
	for (let i = 1; i < len; i++) s += `, ${a[i].name}`;
	s += '.';

	return s;

}