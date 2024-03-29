import { Formula } from 'formulic';
import { Message, User } from "discord.js";
import { BotContext } from '@src/bot/botcontext';
import Cache from 'archcache';
import Game from './game';
import { DiscordBot } from '@src/bot/discordbot';
import { toDirection } from "./world/loc";
import { HumanSlot } from './items/wearable';

import Char from './char/char';
import World from './world/world';
import * as Trade from './trade';
import Race from './char/race';
import CharClass from './char/charclass';
import * as CharGen from './chargen';
import * as ItemGen from './items/itemgen';
import * as display from './display';
import * as gamejs from './game';
import { replyEmbedUrl } from '@src/embeds';

const RPG_DIR = 'rpg/';
const CHAR_DIR = 'chars/';
const LAST_CHARS = '`lastchars`';
// created for each bot context.
export class Rpg {

	readonly cache: Cache;
	readonly charCache: Cache;
	readonly context: BotContext<any>;

	world: World;
	game: Game;

	/**
	 * Map User id's to name of last char played as.
	 */
	private lastChars!: { [id: string]: string };

	constructor(context: BotContext<any>) {

		this.context = context;

		this.cache = this.context.subcache(RPG_DIR);
		this.charCache = this.cache.subcache(CHAR_DIR, Char.FromJSON);

		this.world = new World(this.context.cache);
		this.game = new Game(this, this.charCache, this.world);

	}

	async load() {
		await this.loadLastChars();
	}

	async cmdAllChars(m: Message, uname?: string) {

		try {
			const list = await this.context.getDataList(RPG_DIR + CHAR_DIR);
			if (!list) return m.reply('An unknown error has occurred. Oopsie.');

			return m.reply(list.join(', '));

		} catch (e) { console.log(e); }

	}

	async cmdParty(m: Message, who?: string) {

		const char = await this.userCharOrErr(m, m.author);
		if (!char) return;

		let t;
		if (who) {
			t = await this.loadChar(who);
			if (!t) return;
		}

		return display.sendBlock(m, await this.game.party(char, t));

	}

	async cmdLeader(m: Message, who?: string) {

		const char = await this.userCharOrErr(m, m.author);
		if (!char) return;

		let t;
		if (who) {
			t = await this.loadChar(who);
			if (!t) return;
		}

		return display.sendBlock(m, this.game.setLeader(char, t));

	}

	async cmdRevive(m: Message, who?: string) {

		if (!who) return;

		const char = await this.userCharOrErr(m, m.author);
		if (!char) return;

		const t = who ? await this.loadChar(who) : char;
		if ( !t ) return;

		await display.sendBlock(m, this.game.revive(char, t));

	}

	async cmdLeaveParty(m: Message) {

		const char = await this.userCharOrErr(m, m.author);
		if (!char) return;

		await display.sendBlock(m, this.game.leaveParty(char));
	}

	async cmdMkGuild(m: Message, gname: string) {

		try {
			const char = await this.userCharOrErr(m, m.author);
			if (!char) return;

			await display.sendBlock(m, await this.game.mkGuild(char, gname));
		} catch (e) { console.log(e); }

	}

	async cmdJoinGuild(m: Message, gname: string) {

		const char = await this.userCharOrErr(m, m.author);
		if (!char) return;

		await display.sendBlock(m, await this.game.joinGuild(char, gname));

	}

	async cmdLeaveGuild(m: Message) {

		const char = await this.userCharOrErr(m, m.author);
		if (!char) return;

		await display.sendBlock(m, await this.game.leaveGuild(char));

	}

	async cmdGuildInv(m: Message, who?: string) {

		const char = await this.userCharOrErr(m, m.author);
		if (!char) return;

		const t = who ? await this.loadChar(who) : char;
		if (!t) return;
	
		return display.sendBlock(m, await this.game.guildInv(char, t));

	}

	async cmdWhere(m: Message, who: string) {

		const char = await this.userCharOrErr(m, m.author);
		if (!char) return;

		let t = await this.loadChar(who);
		if (!t) return;
		return m.reply(t.name + ' is at ' + t.loc.toString());

	}

	async cmdNerf(m: Message, who: string) {

		const char = await this.loadChar(who);
		if (!char) return;

		if (!this.context.isOwner(m.author)) return m.reply('You do not have permission to do that.');

		return m.reply(Trade.nerfItems(char));

	}

	async cmdFormula(m: Message, str: string) {

		if (!this.context.isOwner(m.author)) return m.reply('You do not have permission to do that.');
		const char = await this.userCharOrErr(m, m.author);
		if (!char) return;

		try {
			const f = Formula.TryParse(str);
			if (!f) return m.reply('Incantation malformed.');

			const res = f.eval(char);
			return m.reply('result: ' + res);

		} catch (e) { console.log(e); }

	}

	async cmdSetHome(m: Message) {

		const char = await this.userCharOrErr(m, m.author);
		if (!char) return;

		return m.reply(this.world.setHome(char));

	}

	async cmdGoHome(m: Message) {

		const char = await this.userCharOrErr(m, m.author);
		if (!char) return;

		return m.reply(this.game.goHome(char));

	}

	async cmdLocDesc(m: Message, desc: string) {

		const char = await this.userCharOrErr(m, m.author);
		if (!char) return;

		const resp = await this.world.setDesc(char, desc, m.attachments?.first()?.proxyURL);
		if (resp) return m.reply(resp);

	}

	async cmdLore(m: Message, wot?: string) {

		if (!wot) return m.reply('What do you want to know about?');

		return display.sendBlock(m, gamejs.getLore(wot));

	}

	async cmdTake(m: Message, first: string, end: string) {

		try {

			const char = await this.userCharOrErr(m, m.author)
			if (!char) return;

			await m.channel.send(await this.game.take(char, first, end));

		} catch (e) { console.log(e); }
	}

	async cmdDrop(m: Message, what: string, end?: string) {

		const char = await this.userCharOrErr(m, m.author)
		if (!char) return;

		return m.channel.send(await this.game.drop(char, what, end));

	}

	async cmdExplored(m: Message) {

		const char = await this.userCharOrErr(m, m.author);
		if (!char) return;

		return display.sendBlock(m, await this.world.explored(char));

	}

	async cmdViewLoc(m: Message, what: string | number) {

		const char = await this.userCharOrErr(m, m.author);
		if (!char) return;

		const info = await this.world.view(char, what);

		if (typeof (info) === 'string') await display.sendBlock(m, info);
		else display.sendEmbed(m, info[0], info[1]);

	}

	async cmdExamine(m: Message, what: string) {

		const char = await this.userCharOrErr(m, m.author);
		if (!char) return;

		await display.sendBlock(m, await this.world.examine(char, what));

	}

	async cmdLook(m: Message, what: string) {

		const char = await this.userCharOrErr(m, m.author);
		if (!char) return;

		return display.sendBlock(m, await this.world.look(char, what));

	}

	async cmdUseLoc(m: Message, wot: string) {

		const char = await this.userCharOrErr(m, m.author);
		if (!char) return;

		return display.sendBlock(m, await this.world.useLoc(char, wot));
	}

	async cmdHike(m: Message, dir: string) {

		try {

			const char = await this.userCharOrErr(m, m.author);
			if (!char) return;

			await display.sendBlock(m, await this.game.hike(char, toDirection(dir)));
			this.checkLevel(m, char);

		} catch (e) { console.log(e); }

	}

	async cmdMove(m: Message, dir: string) {

		const char = await this.userCharOrErr(m, m.author);
		if (!char) return;

		await display.sendBlock(m, await this.game.move(char, dir));
		this.checkLevel(m, char);

	}

	/**
	 * Roll damage test with current weapon.
	 * @param {*} m
	 */
	async cmdRollDmg(m: Message) {

		const char = await this.userCharOrErr(m, m.author)
		if (!char) return;

		return m.reply('Weapon roll for ' + char.name + ': ' + char.testDmg());

	}

	/**
	 * Roll a new armor for testing.
	 * @param {*} m
	 */
	async cmdRollWeap(m: Message) {

		const char = await this.userCharOrErr(m, m.author)
		if (!char) return;

		await display.sendBlock(m, Trade.rollWeap(char));

	}

	/**
	 * Roll a new armor for testing.
	 * @param {Message} m
	 */
	async cmdRollArmor(m: Message, slot?: string) {

		const char = await this.userCharOrErr(m, m.author)
		if (!char) return;

		await display.sendBlock(m, Trade.rollArmor(char, slot));

	}

	async cmdUnequip(m: Message, slot: HumanSlot) {

		const char = await this.userCharOrErr(m, m.author)
		if (!char) return;

		return m.reply(this.game.unequip(char, slot));

	}

	async cmdEquip(m: Message, wot: string | number) {

		const char = await this.userCharOrErr(m, m.author)
		if (!char) return;

		if (!wot) return display.sendBlock(m, `${char.name} equip:\n${char.listEquip()}`);

		return display.sendBlock(m, this.game.equip(char, wot));

	}

	async cmdCompare(m: Message, wot: string | number) {

		const char = await this.userCharOrErr(m, m.author)
	
		if ( char ){
			if (!wot) return m.reply('Compare what item?');
			return display.sendBlock(m, this.game.compare(char, wot));
		}

	}

	async cmdWorn(m: Message, slot: HumanSlot) {

		const char = await this.userCharOrErr(m, m.author)
		if (!char) return;
		if (!slot) await display.sendBlock(m, `${char.name} equip:\n${char.listEquip()}`);
		else {

			const item = char.getEquip(slot);
			if (!item) return m.reply('Nothing equipped in ' + slot + ' slot.');
			if (typeof (item) === 'string') return m.reply(item);
			else if (Array.isArray(item)) {

				let r = '';
				for (let i = item.length - 1; i >= 0; i--) {
					r += item[i].getDetails() + '\n';
				}
				return m.reply(r);

			} else return m.reply(item.getDetails());

		} //

	}

	async cmdEat(m: Message, wot: string | number) {

		const char = await this.userCharOrErr(m, m.author)
		if (!char) return;

		return m.reply(this.game.eat(char, wot));

	}

	async cmdQuaff(m: Message, wot: string | number) {

		const char = await this.userCharOrErr(m, m.author)
		if (!char) return;

		return m.reply(this.game.quaff(char, wot));

	}

	async cmdRest(m: Message) {
		const char = await this.userCharOrErr(m, m.author);
		if (char) return m.reply(await this.game.rest(char));
	}

	async cmdCook(m: Message, what: string | number) {

		const char = await this.userCharOrErr(m, m.author);
		if (!char) return;

		return m.reply(this.game.cook(char, what));

	}

	cmdPotList(m: Message, level?: string | number) {

		if (!level) return m.reply('List potions for which level?');
		if (typeof level === 'string') level = parseInt(level);
		return m.reply(ItemGen.potsList(level));

	}

	async cmdInscribe(m: Message, wot?: string | number, inscrip?: string) {

		const char = await this.userCharOrErr(m, m.author)
		if (!char) return;

		if (!wot) return m.reply('Inscribe which inventory item?');
		/// allow clearing existing inscription
		if (!inscrip) inscrip = '';

		return m.reply(this.game.inscribe(char, wot, inscrip));

	}

	async cmdDestroy(m: Message, first?: string, end?: string) {

		const char = await this.userCharOrErr(m, m.author)
		if (!char) return;

		if (!first) return m.reply('Destroy which inventory item?');

		return m.reply(this.game.destroy(char, first, end));

	}

	async cmdViewItem(m: Message, which?: string | number) {

		const char = await this.userCharOrErr(m, m.author)
		if (!char) return;

		if (!which) return m.reply('View which inventory item?');

		const item = char.getItem(which);
		if (!item) return m.reply('Item not found.');

		const view = Array.isArray(item) ? item[0].getView() : item.getView();
		if (view[1]) {

			return replyEmbedUrl(m, view[1], view[0]);
		}
		else await m.reply(view[0]);

	}

	async cmdInspect(m: Message, wot?: string | number) {

		const char = await this.userCharOrErr(m, m.author)
		if (!char) return;

		if (!wot) return m.reply('Inspect which inventory item?');

		let item = char.getItem(wot);
		if ( Array.isArray(item)) item = item[0];
		if (!item) return m.reply('Item not found.');
		return m.reply(item.getDetails());

	}

	async cmdCraft(m: Message, itemName?: string, desc?: string) {

		if (!itemName) return m.reply('Crafted item must have name.');
		if (!desc) return m.reply('Crafted items require a description.');

		const char = await this.userCharOrErr(m, m.author)
		if (!char) return;

		const a = m.attachments.first();
		const res = a ? this.game.craft(char, itemName, desc, a.proxyURL) : this.game.craft(char, itemName, desc);

		return display.sendBlock(m, res);

	}

	async cmdBrew(m: Message, potName?: string) {

		if (!potName) return m.reply('Brew what potion?');

		const char = await this.userCharOrErr(m, m.author)
		if (!char) return;

		const a = m.attachments.first();
		const res = a ? this.game.brew(char, potName, a.proxyURL) : this.game.brew(char, potName);

		return display.sendBlock(m, res);

	}

	async cmdInv(m: Message, who?: string) {

		let char;

		if (who) {

			char = await this.loadChar(who);
			if (!char) return m.reply(`'${who}' not found.`);


		} else {

			char = await this.userCharOrErr(m, m.author);
			if (!char) return;

		}

		return display.sendBlock(m, `${char.name} Inventory:\n${char.inv.getMenu()}`);

	}

	async cmdSell(m: Message, first: string | number, end?: string | number) {

		const src = await this.userCharOrErr(m, m.author);
		if (!src) return;

		return display.sendBlock(m, this.game.sell(src, first, end));
	}

	async cmdGive(m: Message, who: string, expr: string) {

		const src = await this.userCharOrErr(m, m.author);
		if (!src) return;

		const dest = await this.loadChar(who);
		if (!dest) return m.reply(`'${who}' does not exist.`);

		return m.reply(this.game.give(src, dest, expr));

	}

	async cmdScout(m: Message) {

		const char = await this.userCharOrErr(m, m.author);
		if (!char) return;

		await display.sendBlock(m, this.game.scout(char));

	}

	async cmdTrack(m: Message, who: string) {

		const src = await this.userCharOrErr(m, m.author);
		if (!src) return;

		const dest = await this.loadChar(who);
		if (!dest) return m.reply(`'${who}' does not exist.`);

		await display.sendBlock(m, this.game.track(src, dest));

	}

	async cmdAttack(m: Message, who?: string | number) {

		try {
			const src = await this.userCharOrErr(m, m.author);
			if (!src) return;

			let targ = await this.world.getNpc(src, who ?? 1);
			let res;

			if (targ) res = await this.game.attackNpc(src, targ);
			else if (typeof who === 'string') {

				targ = await this.loadChar(who);
				if (!targ) return m.reply(`'${who}' not found.`);

				res = await this.game.attack(src, targ);

			} else {
				return m.reply(`'${who}' not found.`);
			}


			await display.sendBlock(m, res);

		} catch (e) { console.log(e); }

	}

	async cmdSteal(m: Message, who: string, wot?: string) {

		const src = await this.userCharOrErr(m, m.author);
		if (!src) return;

		const dest = await this.loadChar(who);
		if (!dest) return m.reply(`'${who}' not found on server.`);

		const result = await this.game.steal(src, dest, wot);
		await display.sendBlock(m, result);

	}

	async cmdRmChar(m: Message, charname?: string) {

		if (!charname) return m.reply('Must specify character to delete.');

		try {

			const char = await this.loadChar(charname);
			if (!char) return m.reply(`'${charname}' not found on server.`);

			if (!char.owner || char.owner === m.author.id) {

				await this.charCache.delete(this.getCharKey(charname));

				// TODO: REMOVE LAST LOADED NAME. etc.
				if (this.lastChars[char.owner] === charname) this.clearUserChar(char.owner);

				return m.reply(charname + ' deleted.');

			} else return m.reply('You do not have permission to delete ' + charname);

		} catch (e) { console.log(e); }

	}

	async cmdViewChar(m: Message, charname?: string) {

		let char;

		if (!charname) {
			char = await this.userCharOrErr(m, m.author);
			if (!char) return;
		} else {
			char = await this.loadChar(charname);
			if (!char) return m.reply(charname + ' not found on server. D:');
		}
		return display.echoChar(m.channel, char);

	}

	async cmdAddStat(m: Message, stat: string) {

		const char = await this.userCharOrErr(m, m.author);
		if (!char) return;

		const res = char.addStat(stat);
		if (typeof (res) === 'string') return m.reply(res);

	}

	async cmdTalents(m: Message, charname?: string) {

		let char;

		if (!charname) {
			char = await this.userCharOrErr(m, m.author);
			if (!char) return;
		} else {
			char = await this.loadChar(charname);
			if (!char) return m.reply(charname + ' not found on server. D:');
		}

		await display.sendBlock(m, char.getTalents());

	}

	async cmdCharStats(m: Message, charname?: string) {

		let char;

		if (!charname) {
			char = await this.userCharOrErr(m, m.author);
			if (!char) return;
		} else {
			char = await this.loadChar(charname);
			if (!char) return m.reply(charname + ' not found on server. D:');
		}

		await display.sendBlock(m, char.getHistory());

	}

	async cmdSaveChar(m: Message) {

		const char = await this.userCharOrErr(m, m.author);
		if (!char) return;

		await this.saveChar(char, true);
		return m.reply(char.name + ' saved.');

	}

	async cmdLoadChar(m: Message, charname?: string) {

		if (!charname) charname = m.author.username;

		try {

			const char = await this.loadChar(charname);
			if (!char) return m.reply(charname + ' not found on server. D:');

			let prefix;

			if (char.owner !== m.author.id) {
				prefix = 'This is NOT your character.\n';
			} else {

				await this.setUserChar(m.author, char);
				prefix = 'Active character set.\n';
			}

			return display.echoChar(m.channel, char, prefix);

		} catch (e) { console.log(e); }

	}

	async cmdRollChar(m: Message, charname?: string, racename?: string, classname?: string, sex?: string) {

		try {

			const race = Race.RandRace(racename);
			if (!race) return await m.reply('Race ' + racename + ' not found.');

			const charclass = CharClass.RandClass(classname);
			if (!charclass) return await m.reply('Class ' + classname + ' not found.');

			if (!sex) sex = Math.random() < 0.5 ? 'm' : 'f';

			if (charname) {

				if (!this.context.isValidKey(charname)) return m.reply(`'${charname}' contains illegal characters.`);
				if (await this.charExists(charname)) return m.reply(`Character '${charname}' already exists.`);

			} else charname = await this.uniqueName(race, sex);

			const char = CharGen.genChar(m.author.id, race, charclass, charname);
			console.log('new char: ' + char.name);

			await this.setUserChar(m.author, char);
			display.echoChar(m.channel, char);
			await this.saveChar(char, true);

		} catch (e) { console.log(e); }

	}

	async charExists(charname: string) { return this.charCache.exists(this.getCharKey(charname)); }

	async userCharOrErr(m: Message, user: User) {

		const charname = this.lastChars[user.id];
		if (!charname) {
			m.reply(`${user.username}: No active character`);
			return null;
		}

		const char = await this.loadChar(charname);
		if (!char) {
			m.reply(`Error loading '${charname}'. Load new character.`);
			return null;

		} else if (char.owner !== user.id) {
			m.reply(`You are not the owner of '${charname}'`);
			return null;
		}
		return char;

	}

	async loadChar(charname: string) {

		const key = this.getCharKey(charname);

		const data = this.charCache.get(key) as Char|undefined;
		return data ?? await this.charCache.fetch(key) as Char|undefined;

	}

	clearUserChar(uid: string) { delete this.lastChars[uid]; }

	async setUserChar(user: User, char: Char) {

		this.lastChars[user.id] = char.name;
		this.cache.cache(LAST_CHARS, this.lastChars);

	}

	async loadLastChars() {

		const lastjson = await this.cache.fetch(LAST_CHARS);
		if (lastjson) {
			this.lastChars = lastjson;
			return lastjson;
		}
		this.lastChars = {};	// uid->char name
		this.cache.cache(LAST_CHARS, this.lastChars);

	}

	checkLevel(m: Message, char: Char) {
		if (char.levelFlag) {
			m.reply(char.name + ' has leveled up.');
			char.levelFlag = false;
		}
	}

	getCharKey(charname: string) { return charname; }

	cacheChar(char: Char) { this.charCache.cache(this.getCharKey(char.name), char); }

	async saveChar(char: Char, forceSave = false) {

		if (forceSave) return this.charCache.store(this.getCharKey(char.name), char);
		this.charCache.cache(this.getCharKey(char.name), char);

	}

	async uniqueName(race: Race, sex?: string) {

		const namegen = await import('./namegen');

		do {
			const name = namegen.genName(race.name, sex);
			if ( name && !(await this.charExists(name)) ) return name;

		} while (true);

	}

} // class

export const initPlugin = (bot: DiscordBot) => {

	const proto = Rpg.prototype;

	// CHAR MANAGEMENT
	bot.addContextCmd('rollchar', 'rollchar [charname] [racename] [classname]', proto.cmdRollChar, Rpg, { maxArgs: 4 });

	bot.addContextCmd('loadchar', 'loadchar <charname>', proto.cmdLoadChar, Rpg, { maxArgs: 1 });
	bot.addContextCmd('savechar', 'savechar', proto.cmdSaveChar, Rpg, { maxArgs: 0 });

	bot.addContextCmd('viewchar', 'viewchar <charname>', proto.cmdViewChar, Rpg, { maxArgs: 1 });
	bot.addContextCmd('rmchar', 'rmchar <charname>', proto.cmdRmChar, Rpg, { minArgs: 1, maxArgs: 1 });
	bot.addContextCmd('charstats', 'charstats [charname]', proto.cmdCharStats, Rpg, { minArgs: 0, maxArgs: 1 });
	bot.addContextCmd('talents', 'talents [charname]', proto.cmdTalents, Rpg, { minArgs: 0, maxArgs: 1 });

	bot.addContextCmd('addstat', 'addstat [statname]', proto.cmdAddStat, Rpg, { minArgs: 1, maxArgs: 1 });

	bot.addContextCmd('allchars', 'allchars\t\tList all character names on server.', proto.cmdAllChars,
		Rpg, { maxArgs: 0 });

	// HELP
	bot.addContextCmd('lore', 'lore wot', proto.cmdLore, Rpg, { minArgs: 1, maxArgs: 1 });
	//bot.addContextCmd( 'rpgchanges', 'rpgchanges', proto.cmdChanges, RPG, {maxArgs:0});

	// PVP
	bot.addContextCmd('attack', 'attack [who] - attack something.', proto.cmdAttack, Rpg, { minArgs: 0, maxArgs: 1, alias: 'a' });
	bot.addContextCmd('track', 'track who', proto.cmdTrack, Rpg, { minArgs: 1, maxArgs: 1 });
	bot.addContextCmd('steal', 'steal fromwho', proto.cmdSteal, Rpg, { minArgs: 1, maxArgs: 2 });

	// PARTY
	bot.addContextCmd('party', 'party [who] - join party, invite to party, or show current party.',
		proto.cmdParty, Rpg, { minArgs: 0, maxArgs: 1 });
	bot.addContextCmd('revive', 'revive [who] - revive a party member.',
		proto.cmdRevive, Rpg, { minArgs: 0, maxArgs: 1 });
	bot.addContextCmd('leader', 'leader [who] - view or set party leader.',
		proto.cmdLeader, Rpg, { minArgs: 0, maxArgs: 1 });
	bot.addContextCmd('leaveparty', 'leaveparty - leave current party', proto.cmdLeaveParty, Rpg, { maxArgs: 0 });

	// GUILD
	bot.addContextCmd('mkguild', 'mkguild [name] - create a new guild', proto.cmdMkGuild, Rpg, { minArgs: 1, maxArgs: 1 });
	bot.addContextCmd('joinguild', 'joinguild [guild] - join a guild', proto.cmdJoinGuild, Rpg, { minArgs: 1, maxArgs: 1 });
	bot.addContextCmd('guildinv', 'guildinv [who] - invite to a guild', proto.cmdGuildInv, Rpg, { minArgs: 1, maxArgs: 1 });
	bot.addContextCmd('leaveguild', 'leaveguild - leave current guild', proto.cmdLeaveGuild, Rpg, { maxArgs: 0 });

	// EQUIP
	bot.addContextCmd('equip', 'equip [what]\t\tEquips item from inventory, or displays all worn items.',
		proto.cmdEquip, Rpg, { minArgs: 0, maxArgs: 1 });
	bot.addContextCmd('wear', 'wear [what]\t\tEquips item from inventory, or displays all worn items.',
		proto.cmdEquip, Rpg, { minArgs: 0, maxArgs: 1 });

	bot.addContextCmd('unequip', 'unequip [equip slot]\t\tRemoves a worn item.',
		proto.cmdUnequip, Rpg, { minArgs: 1, maxArgs: 1 });
	bot.addContextCmd('worn', 'worn [equip slot]\t\tInspect an equipped item.', proto.cmdWorn, Rpg, { maxArgs: 1 });
	bot.addContextCmd('compare', 'compare <pack item> - Compare inventory item to worn item.',
		proto.cmdCompare, Rpg, { minArgs: 1, maxArgs: 1 });

	// ITEMS
	bot.addContextCmd('destroy', 'destroy <item_number|item_name>\t\tDestroys an item. This action cannot be undone.',
		proto.cmdDestroy, Rpg, { minArgs: 1, maxArgs: 2 });
	bot.addContextCmd('inspect', 'inspect <item_number|item_name>', proto.cmdInspect, Rpg, { maxArgs: 1 });
	bot.addContextCmd('viewitem', 'viewitem <item_number|item_name> : View an item.', proto.cmdViewItem, Rpg, { maxArgs: 1 });
	bot.addContextCmd('inv', 'inv [player]', proto.cmdInv, Rpg, { maxArgs: 1 });
	bot.addContextCmd('give', 'give <charname> <what>', proto.cmdGive, Rpg, { minArgs: 2, maxArgs: 2, group: "right" });
	bot.addContextCmd('sell', 'sell <wot> OR !sell <start> <end>', proto.cmdSell, Rpg, { minArgs: 1, maxArgs: 2 });

	// CRAFT
	bot.addContextCmd('craft', 'craft <item_name> <description>', proto.cmdCraft, Rpg, { maxArgs: 2, group: "right" });
	bot.addContextCmd('brew', 'brew <potion> - brew a potion.', proto.cmdBrew, Rpg, { maxArgs: 1, group: "right" });
	bot.addContextCmd('inscribe', 'inscribe <item_number|item_name> <inscription>', proto.cmdInscribe, Rpg, { maxArgs: 2, group: "right" });
	bot.addContextCmd('potlist', 'potlist <level> - list of potions by level.', proto.cmdPotList, Rpg, { minArgs: 1, maxArgs: 1 });

	// DOWNTIME
	bot.addContextCmd('eat', 'eat <what>\t\tEat something from your inventory.', proto.cmdEat, Rpg, { minArgs: 1, maxArgs: 1 });
	bot.addContextCmd('cook', 'cook <what>\t\tCook an item in inventory.', proto.cmdCook, Rpg, { minArgs: 1, maxArgs: 1 });
	bot.addContextCmd('rest', 'rest', proto.cmdRest, Rpg, { maxArgs: 0 });
	bot.addContextCmd('quaff', 'quaff <what>\t\tQuaff a potion.', proto.cmdQuaff, Rpg, { minArgs: 1, maxArgs: 1 });

	bot.addContextCmd('rolldmg', 'rolldmg', proto.cmdRollDmg, Rpg, { hidden: true, maxArgs: 0 });
	bot.addContextCmd('rollweap', 'rollweap', proto.cmdRollWeap, Rpg, { hidden: true, maxArgs: 0 });
	bot.addContextCmd('rollarmor', 'rollarmor [slot]', proto.cmdRollArmor, Rpg, { hidden: true, maxArgs: 1 });


	// TESTING
	bot.addContextCmd('nerf', '', proto.cmdNerf, Rpg, { hidden: true, minArgs: 1, maxArgs: 1 });
	bot.addContextCmd('form', 'form <formula>', proto.cmdFormula, Rpg, { hidden: true, minArgs: 1, maxArgs: 1 });

	// NPC
	bot.addContextCmd('ex', 'ex [monster|npc]', proto.cmdExamine, Rpg, { maxArgs: 1 });

	// LOCATION
	bot.addContextCmd('look', 'look [item on ground]', proto.cmdLook, Rpg, { maxArgs: 1 });
	bot.addContextCmd('view', 'view <item_number|item_name>', proto.cmdViewLoc, Rpg);
	bot.addContextCmd('drop', 'drop <what> OR !drop <start> <end>', proto.cmdDrop, Rpg, { minArgs: 1, maxArgs: 2 });
	bot.addContextCmd('take', 'take <what> OR !take <start> <end>', proto.cmdTake, Rpg, { minArgs: 1, maxArgs: 2 });
	bot.addContextCmd('locdesc', 'locdesc <description>', proto.cmdLocDesc, Rpg, { minArgs: 1, maxArgs: 1 });
	bot.addContextCmd('explored', 'explored', proto.cmdExplored, Rpg, { maxArgs: 0 });
	bot.addContextCmd('sethome', 'sethome', proto.cmdSetHome, Rpg, { maxArgs: 0 });
	bot.addContextCmd('gohome', 'gohome', proto.cmdGoHome, Rpg, { maxArgs: 0 });
	//bot.addContextCmd( 'where', 'where [char]', proto.cmdWhere, RPG, {minArgs:1,maxArgs:1});
	bot.addContextCmd('scout', 'scout', proto.cmdScout, Rpg, { maxArgs: 0 });
	bot.addContextCmd('useloc', 'useloc [feature]', proto.cmdUseLoc, Rpg, { maxArgs: 1 });

	// MOVE
	bot.addContextCmd('move', 'move <direction>', proto.cmdMove, Rpg, { maxArgs: 1 });
	bot.addContextCmd('north', 'north', proto.cmdMove, Rpg, { maxArgs: 0, args: ['north'], alias: 'n' });
	bot.addContextCmd('south', 'south', proto.cmdMove, Rpg, { maxArgs: 0, args: ['south'], alias: 's' });
	bot.addContextCmd('east', 'east', proto.cmdMove, Rpg, { maxArgs: 0, args: ['east'], alias: 'e' });
	bot.addContextCmd('west', 'west', proto.cmdMove, Rpg, { maxArgs: 0, args: ['west'], alias: 'w' });
	bot.addContextCmd('hike', 'hike <direction>', proto.cmdHike, Rpg, { minArgs: 1, maxArgs: 1 });

}

/*
	async cmdChanges(m) {
	let changes = require('./data/changelog.json');
	let list = '';

	for( const k in changes ) {
		list += k + '\n' + changes[k].join('\n') + '\n\n';
	}

	await display.sendBlock( m, list )
}*/