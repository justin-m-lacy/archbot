import Char from './char/char';
import Race from './char/race';
import CharClass from './char/charclass';
import StatBlock, { StatMod, StatName } from './char/stats';
import * as ItemGen from './items/itemgen';
import *  as Dice from './dice';

type ValueRoller = { rolls: number, die: number, mod: number, minVal?: number, maxVal?: number };
type SetValues = { set: string[] }
type StatList = { stat: string | string[] };

type StatGen = (StatList & SetValues) | (StatList & ValueRoller);

// Defines rolling information for stats.
const stat_rolls = {

	// base stat rolls
	base: [
		{ stat: ['str', 'dex', 'con', 'wis', 'int', 'cha'], rolls: 3, die: 6, mod: 0, minVal: 3, maxVal:undefined }
	],

	// info rolls
	info: [
		{ stat: 'sex', set: ['f', 'm'] },
		{ stat: 'gold', rolls: 3, die: 4, mod: 1 }
	]

};

export const genChar = (owner: string, race: Race, charClass: CharClass, name: string, sex?: string) => {

	console.log('generating character...');

	const char = new Char(race, charClass, owner);
	char.name = name;

	const info = rollStats(stat_rolls.info, {});
	if (race.infoMods) modStats(race.infoMods, info);
	modStats(charClass.infoMods, info);
	char.info = info;

	const base = rollStats(stat_rolls.base, new StatBlock());

	base.curHp = base.maxHp = char.HD;

	char.setBaseStats(base);

	boundStats(char);

	initItems(char);

	return char;

}

function modStats(statMods: StatMod, destObj: any) {

	let mod;
	for (const stat in statMods) {

		const cur = destObj[stat];
		mod = statMods[stat as StatName];
		if (typeof mod === 'string') {
			mod = Dice.parseRoll(mod);

		} else {
			mod = statMods[stat as StatName];
		}

		if (cur == null) destObj[stat] = mod;
		else destObj[stat] = cur + mod;

	}

}

function rollStats(statRolls: StatGen[], destObj: any) {

	for (let i = statRolls.length - 1; i >= 0; i--) {

		const rollInfo = statRolls[i];
		const stat = rollInfo.stat;
		if (Array.isArray(stat)) {

			for (let j = stat.length - 1; j >= 0; j--) {
				rollStat(destObj, stat[j], rollInfo);
			}

		} else {

			rollStat(destObj, stat, rollInfo)

		}


	}
	return destObj;

}

function boundStat(dest: any, stat: string, info: { minVal?: number, maxVal?: number }) {

	const cur = dest[stat];
	if (cur == null) return;

	if (info.minVal != null && cur < info.minVal) {
		dest[stat] = info.minVal;
	} else if (info.maxVal != null && cur > info.maxVal) {
		dest[stat] = info.maxVal;
	}

}

const rollStat = (destObj: any, stat: string,
	info: { set: any[] } | { rolls: number, die: number, mod: number }) => {

	if ('set' in info) {
		// choose from set.
		if (destObj.hasOwnProperty(stat)) return;	// already set.
		destObj[stat] = info.set[Math.floor(info.set.length * Math.random())];

	} else {
		destObj[stat] = Dice.roll(info.rolls, info.die, info.mod);
	}

}

/**
 * Bound stats by stat definitions min/max.
 * @param {Char} char
 */
export const boundStats = (char: Char) => {
	
	const stats = stat_rolls.base;
	for (let i = stats.length - 1; i >= 0; i--) {

		const info = stats[i];
		if (info.minVal == null && info.maxVal == null) continue;

		const stat = info.stat;

		if (Array.isArray(stat)) {

			for (let j = stat.length - 1; j >= 0; j--) {
				boundStat(char, stat[j], info);
			}

		} else {

			boundStat(char, stat, info)

		}

	}

}

const initItems = (char: Char) => {

	let count = Math.floor(1 + 3 * Math.random());

	for (count; count >= 0; count--) {
		char.addItem(ItemGen.getMiscItem());
	}
	char.addItem([ItemGen.genWeapon(1), ItemGen.genArmor(null, 1)]);

}