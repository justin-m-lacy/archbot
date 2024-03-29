import Race from "./char/race";
import Class from './char/charclass';
import Cache from 'archcache';
import { Rpg } from "./rpg";
import World from "./world/world";
import Char from './char/char';
import { toDirection, DirVal } from './world/loc';
import { Craft, Item } from './items/item';
import { ItemPicker, ItemIndex } from './inventory';
import Party from './social/party';
import Actor from './char/actor';
import { GuildManager } from './social/guild';
import { LifeState } from './char/actor';
import Monster from './monster/monster';
import Wearable from './items/wearable';
import Potion from './items/potion';
import * as jsutils from '@src/utils/jsutils';
import * as Trade from './trade';
import * as dice from './dice';
import Combat from "./combat/combat";

const itgen = require('./items/itemgen');

var events = ['explored', 'crafted', 'levelup', 'died', 'pks', 'eaten'];

export const getLore = (wot?: string) => {

	const val = Race.GetRace(wot) ?? Class.GetClass(wot);
	if (val) return wot + ': ' + val.desc;

	return 'Unknown entity: ' + wot;

}

/**
 * actions not allowed for each player state.
*/
const illegal_acts: Partial<{ [Property in LifeState]: any }> = {
	"dead": {
		'brew': 1, 'map': 1, 'hike': 1, 'scout': 1,
		"take": 1, "attack": 1, 'drop': 1, "equip": 1, "unequip": 1, "steal": 1, "craft": 1, "track": 1, "quaff": 1,
		'give': 1, 'eat': 1, 'cook': 1, "sell": 1, "destroy": 1, "inscribe": 1, "revive": 1
	}
};

// actions that allow some hp recovery.
var rest_acts = { 'move': 1, 'cook': 1, 'drop': 1 };
var party_acts = ['attack', 'move'];

var eventFb = {
	levelup: '%c has leveled up.',
	explored: '%c has found a new area.',
	died: '%c has died.'
};

var eventExp = {
	explored: 2,
	crafted: 1
};

export default class Game {

	private readonly rpg: Rpg;
	private readonly cache: Cache;
	private readonly charCache: Cache;
	private readonly world: World

	private readonly _charParties: { [char: string]: Party } = {};

	private readonly guilds: GuildManager;

	/**
	 *
	 * @param {RPG} rpg
	 * @param {Cache} charCache character cache.
	 * @param {World} world RPG world
	 */
	constructor(rpg: Rpg, charCache: Cache, world: World) {

		this.rpg = rpg;
		this.world = world;

		this.cache = this.rpg.cache;
		this.charCache = charCache;

		this.guilds = new GuildManager(this.cache.subcache('guilds'));

	}

	skillRoll(act: Actor) { return dice.roll(1, 5 * (act.level + 4)); }

	/**
	 * Determines whether a character can perform a given action
	 * in their current state.
	 * @param {Character} char
	 * @param {string} act - action to attempt to perform.
	 */
	canAct(char: Char, act: string) {
		const illegal = illegal_acts[char.state];
		if (illegal && illegal.hasOwnProperty(act)) {
			char.log(`Cannot ${act} while ${char.state}.`);
			return false;
		}

		return true;
	}

	tick(char: Char, action: string) {

		char.clearLog();

		if (!this.canAct(char, action)) return false;

		this.tickEffects(char, action);

	}

	async move(char: Char, dir: string) {

		if (this.tick(char, 'move') === false) return char.getLog();

		const res = await this.world.move(char, toDirection(dir));

		const p = this.getParty(char);
		if (p && p.leader === char.name) {

			//console.log('Moving party to: ' + char.loc.toString() );
			await p.move(char.loc);

		} else char.recover();

		return char.output(res);
	}

	async hike(char: Char, dir: DirVal) {

		if (this.tick(char, 'hike') === false) return char.getLog();

		const d = char.loc.abs();

		let r = this.skillRoll(char) + char.getModifier('dex') + char.getModifier('wis');
		const p = this.getParty(char);

		r -= d / 10;
		if (p && p.isLeader(char)) r -= 5;
		if (!char.hasTalent('hike')) r -= 20;

		if (r < 0) {
			char.hp -= Math.floor(Math.random() * d);
			return char.output(`${char.name} was hurt trying to hike. hp: (${char.hp}/${char.maxHp})`);
		}
		else if (r < 10) return char.output('You failed to find your way.');

		const loc = await this.world.hike(char, toDirection(dir));
		if (!loc) return char.output('You failed to find your way.');

		if (p && p.leader === char.name) {

			//console.log('Moving party to: ' + char.loc.toString() );
			await p.move(char.loc);

		}

		return char.output(`${char.name}: ${loc.look()}`);

	}

	getParty(char: Char) { return this._charParties[char.name]; }

	makeParty(char: Char, ...invites: string[]) {

		const p = new Party(char, this.charCache);
		this._charParties[char.name] = p;

		for (let i = invites.length - 1; i >= 0; i--) p.invite(invites[i]);

	}

	setLeader(char: Char, tar?: Char) {

		const party = this.getParty(char);
		if (!party) return 'You are not in a party.';

		if (!tar) { return `current leader: ${party.leader}.` }

		if (!party.isLeader(char)) return 'You are not the party leader.';

		if (party.setLeader(tar)) return `${tar.name} is now the party leader.`;
		return `Could not set ${tar.name} to party leader.`;
	}

	async party(char: Char, t?: Char) {

		const party = this.getParty(char);
		if (!t) return await party?.getStatus() ?? "You are not in a party.";

		const other = this.getParty(t);

		if (party) {

			if (other === party) return `${t.name} is already in your party.`;
			if (other) return `${t.name} is already in a party:\n${party.getList()}`;
			if (!party.isLeader(char)) return 'You are not the party leader.';

			party.invite(t);
			return `${char.name} has invited ${t.name} to join their party.`;

		} else if (other) {

			// attempt to accept.
			if (!other.acceptInvite(char)) return `${other.getList()}\\nnYou have not been invited to ${other.leader}'s awesome party.`;

			this._charParties[char.name] = other;
			return `${char.name} Joined ${other.leader}'s party.`;

		} else {

			// neither has party. new party with invite.
			this.makeParty(char, t.name);
			return `${char.name} has invited ${t.name} to join their party.`;

		} //

	}

	leaveParty(char: Char) {

		const name = char.name;

		const p = this.getParty(char);
		if (!p) return `${name} is not in a party.`;
		delete this._charParties[name];

		if (p.leave(char)) {
			// party contains <=1 person, and no invites.
			p.roster.forEach(n => delete this._charParties[n]);
			return `${name}'s party has been disbanded.`;
		}

		return `${name} has left the party.`;

	}

	async mkGuild(char: Char, gname: string) {

		if (char.guild) return `${char.name} is already in a guild.`;

		if ( await this.guilds.GetGuild(gname) ) {
			return `${gname} already exists.`;
		}

		await this.guilds.MakeGuild(gname, char);
		char.guild = gname;

		return `${char.name} created guild '${gname}'.`;

	}

	async joinGuild(char: Char, gname: string) {

		if (char.guild) return `${char.name} is already in a guild.`;

		const g = await this.guilds.GetGuild(gname);
		if (!g) return `${gname} does not exist.`;

		if (g.acceptInvite(char)) {
			char.guild = gname;
			return `${char.name} has joined ${gname}.`;
		}
		return `${char.name} has not been invited to ${gname}.`;

	}

	async leaveGuild(char: Char) {

		const g = char.guild ? await this.guilds.GetGuild(char.guild) : null;
		if (!g) {
			return `${char.name} is not in a guild.`;
		}

		g.leave(char);
		char.guild = undefined;

		return `${char.name} has left ${g.name}.`;

	}

	async guildInv(char: Char, who: Char) {

		const g = char.guild ? await this.guilds.GetGuild(char.guild) : null;
		if (!g) {
			return `${char.name} is not in a guild.`;
		}

		if (!g.isLeader(char)) return `You do not have permission to invite new members to ${g.name}.`;
		g.invite(who);

		return `${who.name} invited to guild '${g.name}'.`;

	}

	goHome(char: Char) {

		if (this.tick(char, 'home') === false) return char.getLog();

		return char.output(this.world.goHome(char));

	}

	compare(char: Char, wot: ItemIndex): string {

		const it = char.getItem(wot) as Item | undefined;
		if (!it) return 'Item not found.';

		let res = 'In Pack: ' + it.getDetails() + '\n';
		if (it instanceof Wearable) {
			const eq = char.getEquip(it.slot);

			if (!eq) res += 'Equip: nothing';
			else if (Array.isArray(eq)) res += 'Equip: ' + Item.DetailsList(eq);
			else res += 'Equip: ' + eq.getDetails();
		} else {
			res += `${it.name} cannot be equipped.\n`;
		}
		return res;

	}

	equip(char: Char, wot: ItemIndex) {

		if (!wot) return `${char.name} equip:\n${char.listEquip()}`;

		if (this.tick(char, 'equip') === false) return char.getLog();

		let res = char.equip(wot);
		if (res === true) res = char.name + ' equips ' + wot;	// TODO,echo slot used.
		else if (typeof res === 'string') {
			return res;
		}
		else res = char.name + ' does not have ' + wot;

		return char.output(res);

	}

	inscribe(char: Char, wot: ItemIndex, inscrip: string) {

		if (this.tick(char, 'inscribe') === false) return char.output();

		const item = char.getItem(wot) as Item | undefined;
		if (!item) return char.output('Item not found.');

		item.inscription = inscrip;
		char.addHistory('inscribe');

		return char.output(`${item.name} inscribed.`);

	}

	destroy(char: Char, first: string | number, end?: string | number) {

		if (this.tick(char, 'destroy') === false) return char.output();

		if (end) {

			const items = char.takeRange(first, end);
			if (!items) return char.output('Invalid item range.');
			return char.output(items.length + ' items destroyed.');

		} else {

			const item = char.takeItem(first);
			if (!item) return char.output(`'${first}' not in inventory.`);
			if (Array.isArray(item)) {
				return char.output(`${item.length} items are gone forever.`);
			} else {
				return char.output(item.name + ' is gone forever.');
			}

		} //

	}

	sell(char: Char, first: string | number, end?: string | number) {

		if (this.tick(char, 'sell') === false) return char.output();

		return char.output(Trade.sell(char, first, end));

	}

	give(src: Char, dest: Char, expr: string) {

		if (this.tick(src, 'give') === false) return src.output();

		return src.output(Trade.transfer(src, dest, expr));

	}

	cook(char: Char, wot: string | number | Item) {

		if (this.tick(char, 'cook') === false) return char.output();

		return char.output(char.cook(wot));

	}

	brew(char: Char, itemName: string, imgURL?: string) {

		if (!char.hasTalent('brew')) return `${char.name} does not know how to brew potions.`;

		const pot = itgen.genPot(itemName);
		if (!pot) return `${char.name} does not know how to brew ${itemName}.`;

		if (this.tick(char, 'brew') === false) return char.output();



		const s = this.skillRoll(char) + char.getModifier('wis');
		if (s < 10 * pot.level) {
			return char.output(`${char.name} failed to brew ${itemName}.`);
		}

		if (pot.level) char.addExp(2 * pot.level);
		char.addHistory('brew');
		const ind = char.addItem(pot);

		return char.output(`${char.name} brewed ${itemName}. (${ind})`);

	}

	craft(char: Char, itemName: string, desc?: string, imgURL?: string) {

		if (this.tick(char, 'craft') === false) return char.output();

		const ind = Craft(char, itemName, desc, imgURL);

		return char.output(`${char.name} crafted ${itemName}. (${ind})`);

	}

	unequip(char: Char, slot?: string) {

		if (this.tick(char, 'unequip') === false) return char.output();

		if (!slot) return char.output('Specify an equip slot to remove.');

		if (char.unequip(slot)) return char.output('Removed.');
		return char.output('Cannot unequip from ' + slot);

	}

	async drop(char: Char, what: ItemPicker, end?: ItemIndex) {

		if (this.tick(char, 'drop') === false) return char.output();

		return char.output(await this.world.drop(char, what, end));

	}

	async take(char: Char, first: ItemIndex, end?: ItemIndex) {

		if (this.tick(char, 'take') === false) return char.output();

		return char.output(await this.world.take(char, first, end));

	}

	revive(char: Char, targ: Char) {

		if (targ.state !== 'dead') return `${targ.name} is not dead.`;
		const p = this.getParty(char);
		if (!p || !p.includes(targ)) return `${targ.name} is not in your party.`;

		if (this.tick(char, 'revive') === false) return char.output();

		let roll = this.skillRoll(char) + char.getModifier('wis') + 2 * targ.curHp - 5 * targ.level;
		if (!char.hasTalent('revive')) roll -= 20;
		if (roll < 10) return char.output(`You failed to revive ${targ.name}.`);

		char.addHistory('revived');

		targ.revive();
		return char.output(`You have revived ${targ.name}.`);

	}

	async rest(char: Char) {

		if (this.tick(char, 'rest') === false) return char.output();

		const p = this.getParty(char);
		if (p && p.isLeader(char)) {

			const pct = Math.round(100 * await p.rest());
			if (pct === 100) return char.output(`${p.name} fully rested.`);
			else return char.output(`${p.name} ${pct}% rested.`);

		} else char.rest();

		return char.output(`${char.name} rested. hp: ${char.curHp}/${char.maxHp}`);

	}

	scout(char: Char) {

		if (this.tick(char, 'scout') === false) return char.output();

		const r = (char.skillRoll() + char.getModifier('int'));

		if (r < 5) return char.output('You are lost.');

		const err = Math.floor(400 / r);
		const x = Math.round(char.loc.x + err * (Math.random() - 0.5));
		const y = Math.round(char.loc.y + err * (Math.random() - 0.5));

		return char.output(`You believe you are near (${x},${y}).`);

	}

	tickEffects(char: Char, action?: string) {

		const efx = char.effects;
		if (!efx) return;

		for (let i = efx.length - 1; i >= 0; i--) {

			const e = efx[i];
			if (e.tick(char)) {
				// efx end.
				jsutils.fastCut(efx, i);
				e.end(char);

			}

		}

	}

	track(char: Char, targ: Char) {

		if (this.tick(char, 'track') === false) return char.output();

		let r = (char.skillRoll() + char.getModifier('int')); // - (targ.skillRoll() + targ.getModifier('wis') );
		if (char.hasTalent('track')) r *= 2;
		else r -= 10;

		const src = char.loc;
		const dest = targ.loc;
		const d = src.dist(dest);

		if (d === 0) return char.output(`${targ.name} is here.`);
		else if (d <= 2) return char.output(`You believe ${targ.name} is nearby.`);
		else if (d > r) return char.output(`You find no sign of ${targ.name}`);

		const a = Math.atan2(dest.y - src.y, dest.x - src.x) * 180 / Math.PI;
		const abs = Math.abs(a);

		let dir;
		if (abs < (90 - 45 / 2)) dir = 'east';
		else if (abs > (180 - (45 / 2))) dir = 'west';

		if (a > 0 && Math.abs(90 - a) < (3 * 45) / 2) dir = dir ? 'north ' + dir : 'north';
		else if (a < 0 && Math.abs(-90 - a) < (3 * 45) / 2) dir = dir ? 'south ' + dir : 'south';

		let dist;
		if (d < 20) dist = '';
		else if (d < 50) dist = 'somewhere';
		else if (d < 125) dist = 'far';
		else if (d < 225) dist = 'incredibly far';
		else if (d < 300) dist = 'unbelievably far';
		else dist = 'imponderably far';

		return char.output(`You believe ${targ.name} is ${dist ? dist + ' ' : ''}to the ${dir}.`);

	}

	async attackNpc(src: Char, npc: Monster) {

		if (this.tick(src, 'attack') === false) return src.output();

		let p1: Char | Party = this.getParty(src);
		if (!p1 || !p1.isLeader(src)) p1 = src;

		const com = new Combat(p1, npc, this.world);
		await com.fightNpc();

		return src.output(com.getText());

	}

	async steal(src: Char, dest: Char, wot?: ItemPicker) {

		if (this.tick(src, 'steal') === false) return src.output();

		const com = new Combat(src, dest, this.world);
		await com.steal(wot);

		return src.output(com.getText());

	}

	async attack(src: Char, dest: Char) {

		if (this.tick(src, 'attack') === false) return src.output();

		const p1 = this.getParty(src) || src;
		let p2: Char | Party = this.getParty(dest);

		if (!p2 || (!p2.isLeader(dest) && !p2.loc.equals(dest.loc))) {
			p2 = dest;
		}

		const com = new Combat(p1, p2, this.world);
		await com.fight();

		return src.output(com.getText());

	}

	quaff(char: Char, wot: ItemIndex) {

		if (this.tick(char, 'quaff') === false) return char.output();

		const p = char.getItem(wot) as Item | undefined;
		if (!p) return char.output('Item not found.');
		if (p.type !== 'potion') return char.output(`${p.name} cannot be quaffed.`);

		// remove the potion.
		char.takeItem(p);
		if (p instanceof Potion) {
			char.addHistory('quaff');
			p.quaff(char);

			return char.output(`${char.name} quaffs ${p.name}.`);
		} else {
			return char.output(`${p} cannot be quaffed.`);
		}

	}

	eat(char: Char, wot: ItemIndex) {

		if (this.tick(char, 'eat') === false) return char.output();
		return char.output(char.eat(wot));

	}

} //Game