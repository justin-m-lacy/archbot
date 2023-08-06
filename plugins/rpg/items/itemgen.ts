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
import baseWeapons from '../data/items/weapons.json';
import baseArmors from '../data/items/armors.json';
import featureList from '../data/world/features.json';

type RawArmorData = (typeof baseArmors)[number];
type RawWeaponData = (typeof baseWeapons)[number];
type RawPotionData = (typeof import('../data/items/potions.json'))[number]&{type?:string};

type RawItemData = (typeof import('../data/items/items.json')['misc'|'special'][number])

const allItems: { [str: string]: RawItemData|RawPotionData } = {};
const allPots: { [name: string]: RawPotionData } = {};
const potsByLevel: { [key: number]: RawPotionData[] } = [];

let miscItems: RawItemData[];
const featureByName: { [key: string]: typeof featureList[number] } = {};


const armorBySlot: Partial<{ [Property in HumanSlot]: RawArmorData[] }> = {};

initItems();
initArmors();
initPots();
initScrolls();
initChests();

initFeatures();

Material.LoadMaterials();

async function initItems() {

	const items = (await import('../data/items/items.json')).default;
	const spec = items.special;

	miscItems = items.misc;

	for (let i = miscItems.length - 1; i >= 0; i--) {
		allItems[miscItems[i].name.toLowerCase()] = miscItems[i];
	}

	for (let i = spec.length - 1; i >= 0; i--) {
		allItems[spec[i].name.toLowerCase()] = spec[i];
	}

}

async function initPots() {

	const pots = (await import('../data/items/potions.json')).default;

	for (let i = pots.length - 1; i >= 0; i--) {

		const p:RawPotionData = pots[i];
		p.type = ItemType.Potion;	// assign type.

		const name = p.name.toLowerCase();
		allItems[name] = allPots[name] = p;

		const a = potsByLevel[p.level] ?? (potsByLevel[p.level] = []);
		a.push(p);

	}

	return allPots;

}

async function initChests() {

	const packs = require('../data/items/chests.json');

	for (let i = packs.length - 1; i >= 0; i--) {

		const p = packs[i];
		p.type = 'chest';	// assign type.

		allItems[p.name.toLowerCase()] = p;

	}

}

function initScrolls() {
}

function initArmors() {

	for (let k = baseArmors.length - 1; k >= 0; k--) {

		const armor = baseArmors[k];
		const slot = armor.slot as HumanSlot;

		const list = armorBySlot[slot] ?? ( armorBySlot[slot] = [] );
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
	const tmp = baseWeapons[Math.floor(baseWeapons.length * Math.random())];

	if (!tmp) {
		console.log('weapon template null.');
		return null;
	}

	return Weapon.FromData(tmp, mat);

}

export const genArmor = (slot: HumanSlot | null = null, lvl: number = 0) => {

	const mat = Material.Random(lvl);
	if (mat === null) { console.log('material is null'); return null; }

	let tmp;
	if (slot) {
		tmp = getSlotRand(slot, lvl);
	} else {
		const list = baseArmors.filter((t: RawArmorData) => !t.level || t.level <= lvl);
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

	const lvl = Math.floor(mons.level);

	const loot: Loot = {
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
		const itms = getDrops(mons);
		if (itms) loot.items = loot.items!.concat(itms);
	}


	return loot;

}

const getDrops = (mons: Monster) => {

	const drops = mons.drops;
	if (!drops) return;

	if (Array.isArray(drops)) {

		const it = drops[Math.floor(Math.random() * drops.length)];
		return procItem(it);

	} else if (typeof (drops) === 'string') {

		return Math.random() < 0.7 ? procItem(drops) : null;

	} else {

		const items = [];
		for (const k in drops) {

			if (100 * Math.random() < drops[k]) {
				const it = procItem(k);
				if (it) items.push(it);
				else console.log('item not found: ' + k);
			}

		}
		return items;

	}

}

const procItem = (name: string) => {

	const data = allItems[name];
	return data ? fromJSON(data) :null;

}

/**
 * Returns a useless item.
 */
export const getMiscItem = () => {

	const it = miscItems[Math.floor(miscItems.length * Math.random())];
	return fromJSON(it);

}

/**
 * Create named feature from data.
 * @param {string} s
 */
export const genFeature = (s: string) => {
	const d = featureByName[s];
	return d ? Feature.FromJSON(d) : null;
}


function initFeatures() {

	for (let i = featureList.length - 1; i >= 0; i--) {
		featureByName[featureList[i].name] = featureList[i];
	}

}

export const potsList = (level: number) => {

	const a = potsByLevel[level];
	if (!a) return 'No potions of level ' + level + '.';

	const len = a.length;
	//let p = a[0];
	let s = `${a[0].name}`;
	for (let i = 1; i < len; i++) s += `, ${a[i].name}`;
	s += '.';

	return s;

}