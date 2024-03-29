import { Message, PermissionFlagsBits } from 'discord.js';
import { ReactSet } from './reactset';
import { Display } from '@src/display';
import { BotContext, ContextSource } from '@src/bot/botcontext';
import { Reaction } from './reaction';
import { DiscordBot } from '@src/bot/discordbot';
import { replyEmbedUrl, getEmbedUrl } from '@src/embeds';

/**
 * @const {number} PROC_RATE - Base Proc chance to try any reaction.
 */
const PROC_RATE: number = 0.1;

/**
 * @const {RegEx} regExTest - test if string defines a regex.
 */
const regExTest = /^\s*\/(.+)\/([gim]{0,3})\s*$/;

type ReactMap = Map<string, ReactSet>;

let globalReacts: ReactMap, globalRegEx: ReactMap;


/**
 * Handles reactions for a single DiscordContext.
 */
class GuildReactions {

	/**
	 * @property {BotContext}
	 */
	get context() { return this._context; }

	private _context: BotContext<ContextSource>;

	private allReacts: {
		regex: ReactMap,
		strings: ReactMap
	} = {
			regex: new Map(),
			strings: new Map()
		};

	private reactions: ReactMap = new Map();

	/**
	 * @property reMap - Reactions with Regular Expression triggers.
	 * Map key is the string version of the RegEx object.
	 */
	private reMap: ReactMap = new Map<string, ReactSet>();

	private _procPct: number = PROC_RATE;

	/**
	 * @property minWait - minimum time in milliseconds between
	 * repeats of a single trigger.
	 */
	private minWait: number = 1000;

	/**
	 * @property {number} gWait - global wait in milliseconds between
	 * any reactions at all (per Context.)
	 */
	private gWait: number = 20000;

	/**
	 * @property {number} msgTime - last time message was received in this context.
	 */
	private msgTime: number = 0;

	private gTime: number = 0;

	/**
	 * @constructor
	 * @param {BotContext} context
	 */
	constructor(context: BotContext<ContextSource>) {

		this._context = context;

		this.loadReactions();

		// begin listening for messages to react to.
		this.listen();

	}

	listen() {

		this._context.onMsg(m => {

			if (Math.random() > this._procPct) return;

			// global timeout wait.
			const now = Date.now();
			if (now - this.gTime < this.gWait) return;

			try {

				this.msgTime = now;

				const rset = this.findSet(m.content);
				if (rset !== null) {

					return this.respond(m, rset);

				}

			} catch (e) { console.error(e); }

		});

	}

	/**
	 * Respond with a reaction from the given ReactSet
	 * @param {Message} m
	 * @param {ReactSet} rset
	 * @returns {Promise}
	 */
	async respond(m: Message, rset: ReactSet) {

		const last = rset.lastUsed;
		if (last && (this.msgTime - last) < this.minWait) return;
		rset.lastUsed = this.msgTime;
		this.gTime = this.msgTime;

		// get random reaction from set.
		const react = rset.getRandom();

		if (!react) return null;

		const resp = react.getResponse(rset.trigger, m.content);
		if (react.embed) {

			return replyEmbedUrl(m, react.embed, resp ?? '');
		} else if (resp) return m.channel.send(resp);

	}

	/**
	 * Respond with a reaction from the given ReactSet
	 * @param {Message} m
	 * @param {ReactSet} rset
	 * @returns {Promise}
	 */
	async respondTest(m: Message, rset: ReactSet, input: string) {

		// get random reaction from set.
		const react = rset.getRandom();


		if (react) {

			const resp = react.getResponse(input, input);
			if (react.embed) {
				return replyEmbedUrl(m, react.embed, resp ?? ' ');
			} else if (resp) return m.reply(resp);

		}

		return m.reply('No reactions found for "' + input + '"');

	}

	/**
	 * Command to add a reaction.
	 * @async
	 * @param {Message} m - User message.
	 * @param {string} trig - string or regex string to react to.
	 * @param {string} react - the reaction or reaction template to respond with.
	 * @returns {Promise}
	 */
	async cmdAddReact(m: Message, trig: string, react: string) {

		const embedUrl = getEmbedUrl(m);

		if (!trig || (!react && !embedUrl)) return m.channel.send('Usage: !react "string" "response"');

		if (regExTest.test(trig)) {
			this.addRegEx(trig, react, m.author.id, embedUrl);
		} else this.addString(trig, react, m.author.id, embedUrl);

		await this.storeReacts();

		if (react) return m.channel.send('Okie Dokie: ' + trig + " -> " + react);
		else return m.channel.send('Reaction set.')

	}

	async cmdTestReact(m: Message, trig: string) {

		const rset = this.findSet(trig);
		if (rset !== null) {
			console.log(`react set found...`);
			return this.respondTest(m, rset, trig);
		} else return m.reply('No reaction found for "' + trig + '"');

	}

	/**
	 * Command to remove a reaction.
	 * @async
	 * @param {Message} m
	 * @param {string} trig - reaction trigger.
	 * @param {string} which
	 * @returns {Promise}
	 */
	async cmdRmReact(m: Message, trig?: string, which?: string) {

		if (trig) {

			let res;

			if (this.reMap.has(trig)) res = this.removeReact(this.reMap, trig, which, true);
			else res = this.removeReact(this.reactions, trig, which);

			if (res === true) {

				await this.storeReacts();
				return m.channel.send('Reaction removed.');

			} else if (res === false) return m.channel.send(`Reaction for \`${trig}\` not found.`);

			// multiple reactions found.
			return m.channel.send(`${res} reactions found for trigger: ${trig}`);

		}

		return m.channel.send('Usage: !rmreact "trigger" ["reaction"]');

	}

	/**
	 * Command to display information about a given Trigger/Reaction combination.
	 * @async
	 * @param {Message} m
	 * @param {string} trig - Reaction trigger.
	 * @param {string|null|undefined} [which=null] - The specific reaction for the given trigger
	 * to get information for.
	 * @returns {Promise}
	 */
	async cmdReactInfo(m: Message, trig: string, which?: string) {

		const reacts = this.getReactions(trig, which);
		if (!reacts) return m.channel.send('No reaction found.');

		const resp = await this.infoString(reacts, true);

		return Display.sendPage(m.channel, resp, 0);

	}

	/**
	 * Display all information for a reaction trigger.
	 * @async
	 * @param {Message} m
	 * @param {string} trig - Reaction trigger.
	 * @param {number} [page=1] - The page of text.
	 * @returns {Promise}
	 */
	async cmdReacts(m: Message, trig: string, page: number = 1) {

		if (trig == '/') {
			console.log(`returning regex reacts`);
			return this.cmdRegexReacts(m, page);
		}

		const reacts = this.getReactions(trig);
		if (!reacts) return m.channel.send('No reaction found.');

		let resp = await this.infoString(reacts);

		// must save before response is extended by total reaction count.
		const pagingFooter = Display.pageFooter(resp);

		// get a single page of the response.
		resp = Display.getPageText(resp, page - 1);

		// append reaction count.
		if (Array.isArray(reacts)) resp += `\n\n${reacts.length} total reactions`;
		resp += '\n\n' + pagingFooter;

		return m.channel.send(resp);

	}

	async cmdRegexReacts(m: Message, page: number = 1) {

		const reacts = this.getAllRegEx();

		if (reacts.length == 0) {
			return m.channel.send('No regex reactions found.');
		}

		const infos = await Promise.all(reacts.map(v => this.infoString(v.reacts, false, false)));

		const text = reacts.map(
			(v, ind) => `${ind + 1}) \`${v.trigger}\`:  ${infos[ind]}`
		).join('\n\n');

		// must save before response is extended by total reaction count.
		const pagingFooter = Display.pageFooter(text);

		// get a single page of the response.
		let resp = Display.getPageText(text, page - 1);

		// append reaction count.
		if (Array.isArray(reacts)) resp += `\n\n${reacts.length} total reactions`;
		resp += '\n\n' + pagingFooter;

		return m.channel.send(resp);
	}

	/**
	 * Get all custom defined triggers.
	 * @param {Message} m
	 * @param {number} [page=1]
	 * @returns {Promise}
	 */
	async cmdTriggers(m: Message, page: number = 1) {

		// list of all triggers defined for server.
		const triggers = this.getTriggers();

		if (triggers.length <= 0) {
			return m.channel.send('No custom reactions found.');
		} else {

			let pageText = '`' + Display.getPageText(triggers.join('  •  '), page - 1) + '`';
			const footer = Display.pageFooter(pageText);

			pageText += '\n\n' + triggers.length + ' triggers defined.' + '\n' + footer;

			return m.channel.send(pageText);

		}

	}

	/**
	 * Removes a reaction for the given trigger. If no reaction is specified, the reaction trigger will be removed if the given trigger
	 * has only a single reaction entry.
	 * @param map
	 * @param trig - The reaction trigger to remove a reaction from.
	 * @param [reaction=null] - The reaction string to remove.
	 * @param [isRegex=false] - If the trigger is a regular expression.
	 * @returns true if a reaction is removed.
	 * If multiple reactions match, none are removed, and the number found is returned.
	 * If no matching trigger/reaction pair is found, false is returned.
	 */
	removeReact(map: Map<string, ReactSet>, trig: string, reaction?: string, isRegex: boolean = false) {

		if (isRegex === false) trig = trig.toLowerCase();

		const rset = map.get(trig);
		if (rset === undefined) {
			return false;
		}

		const res = rset.tryRemove(reaction);
		if (res === true && rset.isEmpty()) map.delete(trig);

		return res;

	}

	/**
	 * @async
	 * @returns {Promise}
	 */
	async storeReacts() {

		return this._context.storeData(this._context.getDataKey('reactions', 'reactions'), this.allReacts, true);

	}

	/**
	 * Regex reacts use standard JS regular expressions within quote marks "\^w+\" etc.
	 * Reactions can contain $n substitution groups where n is a 1-indexed group from the regular expression.
	 * @param {string} trig - regex trigger for reaction.
	 * @param {string} react
	 * @param {string} uid - discord id of creator.
	 * @param {string} [embedUrl=null] - url of linked attachment/embed.
	 */
	addRegEx(trig: string, react: string, uid: string, embedUrl?: string) {

		let rset = this.reMap.get(trig);

		if (rset === undefined) {

			const regex = toRegEx(trig);	// takes flags into account.
			if (!regex) {
				return;
			}

			rset = new ReactSet(regex);
			// @note map key is string. ReactSet trigger is regex.
			this.reMap.set(trig, rset);


		}
		rset.add(react, uid, embedUrl);

	}

	/**
	 * Add a string-trigger reaction.
	 * @param {string} trig - substring which triggers the reaction.
	 * @param {string} react
	 * @param {string} uid - discord id of reaction creator.
	 * @param {string} [embedUrl=null] - url of linked attachment/embed.
	 */
	addString(trig: string, react: string, uid: string, embedUrl?: string | null) {

		trig = trig.toLowerCase();
		let rset = this.reactions.get(trig);
		if (rset === undefined) {
			rset = new ReactSet(trig);
			this.reactions.set(trig, rset);
		}

		rset.add(react, uid, embedUrl);

	}

	/**
	 * Find a reaction set for the given input text.
	 * @param str - Message to react to.
	 * @returns Reaction string for the message, or null
	 * if no match found.
	 */
	findSet(str: string): ReactSet | null {

		let rset = this.tryRegEx(this.reMap, str);
		if (rset !== null) return rset;

		rset = this.tryRegEx(globalRegEx, str);
		if (rset !== null) return rset;

		str = str.toLowerCase();
		rset = this.tryReact(this.reactions, str);
		if (rset !== null) return rset;

		return this.tryReact(globalReacts, str);

	}

	/**
	 *
	 * @param map
	 * @param str - input string to test.
	 * @returns {ReactSet|null} string reaction or null.
	 */
	tryReact(map: ReactMap, str: string) {

		for (const k of map.keys()) {

			if (str.indexOf(k) >= 0) {

				const rset = map.get(k);
				if (rset !== undefined) return rset;

			}

		}
		return null;
	}

	/**
	 * Determine if string matches a regex trigger.
	 * @param reMap - Map of regular expressions being tested.
	 * @param  str - string being tested.
	 * @returns {ReactSet|null}
	 */
	tryRegEx(map: Map<string, ReactSet>, str: string) {

		for (const rset of map.values()) {

			if ((rset.trigger as RegExp).test(str) === true) {

				return rset;

			}

		} //
		return null;

	}

	/**
	 * Return string of information for the given reaction object.
	 * @async
	 * @param {string|object|Array} react
	 * @param {boolean} [details=false] return extended reaction details.
	 * @returns {Promise<string>}
	 */
	async infoString(react: string | Reaction | Array<string | Reaction> | null, details: boolean = false, indexed: boolean = true): Promise<string> {

		if (react === null || react === undefined) return '';
		if (typeof react === 'string') return react + (details ? ' ( Creator unknown )' : '');

		if (Array.isArray(react)) {

			let list = await Promise.all(react.map(v => this.infoString(v, details)));
			if (indexed) {
				list = list.map((v, i) => `${(i + 1)}) ${v}`);
			}
			return list.join('\n\n');

		} else if (typeof react === 'object') {

			return await this.infoObject(react, details);

		}

		return 'Unknown Reaction';

	}

	/**
	 * Get information on a reaction object.
	 * @param react 
	 * @param details 
	 * @returns 
	 */
	async infoObject(react: Reaction, details: boolean = false) {

		let resp = react.r || '';
		if (react.embed) resp += '\nEmbedded URL: `' + react.embed + '`';


		if (react.uid) {

			const name = await this._context.displayName(react.uid);
			if (name) {

				resp += `\nCreated by ${name}`;
				if (details) resp += ` (id:${react.uid})`;

			} else resp += `\nCreated by user id: ${react.uid}`;

			if (details && react.t) resp += ` @ ${new Date(react.t)}`;

		}
		return resp;

	}

	/**
	 * @returns {string[]} - array of all string/regex string triggers.
	 */
	getTriggers(): string[] {

		const a = Array.from(this.reMap.keys());
		for (const p of this.reactions.keys()) {
			a.push(p);
		}

		return a;
	}

	/**
	 *
	 * @param trig - trigger for the reaction.
	 * @param reactStr - the reaction string to return, or null to return all reactions for
	 * the given trigger.
	 * @returns Returns the single reaction found, or an array of reactions
	 * if no reactStr is specified.
	 * Returns false if no reactions match the trigger or trigger/reactStr combination.
	 */
	getReactions(trig: string | null | undefined, reactStr?: string) {

		if (!trig) return;

		const rset = this.reMap.get(trig) ?? this.reactions.get(trig.toLowerCase());
		return rset?.findReactions(reactStr) ?? null;

	}

	/**
	 * @returns - All reactions from regular expressions.
	 */
	getAllRegEx() {

		return Array.from(this.reMap.values());
	}

	/**
	 * @async
	 */
	async loadReactions() {

		try {

			const reactData = await this._context.fetchData(this._context.getDataKey('reactions', 'reactions'));
			if (!reactData) return null;

			this.allReacts = parseReacts(reactData);

			this.reactions = this.allReacts.strings;

			this.allReacts.regex.forEach((v, k) => this.reMap.set(k, v));

			this._procPct = (await this._context.getSetting('reactPct')) || this._procPct;

		} catch (e) { console.error(e); }

	}

} //

/**
 *
 * @param {Object} reactData - reaction data.
 * @returns {Object}
 */
function parseReacts(data: any) {

	return {
		toJSON() {

			return {
				strings: mapToJSON(this.strings),
				regex: mapToJSON(this.regex)
			}

		},
		strings: parseStrings(data.strings || data),
		regex: parseRe(data.regex)
	};
}

/**
 *
 * @param {*} data
 * @returns {Map} - Reaction map.
 */
function parseStrings(data: any) {

	const map = new Map<string, ReactSet>()

	for (const p in data) {
		map.set(p, new ReactSet(p, data[p]));
	}

	return map;

}

/**
 *
 * @param {Object|null} data
 * @returns {Map} - Reaction map.
 */
function parseRe(data: any) {

	const map = new Map<string, ReactSet>();

	if (data) {

		let r: RegExp | boolean;
		for (const p in data) {

			if ((r = toRegEx(p)) !== false) map.set(p, new ReactSet(r, data[p]));

		}

	}

	return map;

}

/**
 *
 * @param {Map} map
 * @returns {Object}
 */
function mapToJSON(map: any) {

	const o: any = {};
	for (const [k, v] of map) {
		o[k] = v;
	}
	return o;
}

/**
 * Tests if a string represents a valid regular expression.
 * If if does, the regular expression is returned.
 * If not, false is returned.
 * @param {string} s
 * @returns {RegExp|false}
 */
const toRegEx = (s: string) => {

	const res = regExTest.exec(s);
	if (res === null) return false;

	try {
		return new RegExp(res[1], res[2]);
	} catch (e) { }

	return false;
}

/**
 * Initialize plugin.
 * @param {DiscordBot} bot
 */
export const initPlugin = (bot: DiscordBot) => {

	const parsed = parseReacts(require('./reactions-data.json'));
	globalReacts = parsed.strings;
	globalRegEx = parsed.regex;

	bot.addContextClass(GuildReactions);
	bot.addContextCmd('react', 'react <trigger> <response string>',
		GuildReactions.prototype.cmdAddReact, GuildReactions, { minArgs: 2, maxArgs: 2, group: 'right' });

	bot.addContextCmd('reacttest', 'reacttest <trigger>',
		GuildReactions.prototype.cmdTestReact, GuildReactions, { minArgs: 1, maxArgs: 1, group: 'left' });

	bot.addContextCmd('reactinfo', 'reactinfo <trigger> [response]',
		GuildReactions.prototype.cmdReactInfo, GuildReactions, { minArgs: 1, maxArgs: 2, group: 'right' });
	bot.addContextCmd('reacts', 'reacts <trigger|"\\"> [page]',
		GuildReactions.prototype.cmdReacts, GuildReactions,
		{ minArgs: 1, maxArgs: 2, group: 'left' });
	bot.addContextCmd('reactsre', 'reactsre [page]',
		GuildReactions.prototype.cmdRegexReacts, GuildReactions,
		{ minArgs: 0, maxArgs: 1, group: 'left' });


	bot.addContextCmd('triggers', 'triggers [page]',
		GuildReactions.prototype.cmdTriggers, GuildReactions,
		{ minArgs: 0, maxArgs: 1, group: 'left' });

	bot.addContextCmd('rmreact', 'rmreact <trigger> [response]',
		GuildReactions.prototype.cmdRmReact, GuildReactions,
		{ minArgs: 1, maxArgs: 2, group: 'right', access: PermissionFlagsBits.Administrator });

}