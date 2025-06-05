import ArchCache from 'archcache';
import { Channel, Guild, GuildMember, Message, PermissionResolvable, TextBasedChannel, User } from 'discord.js';
import * as afs from '../afs';
import Access from './access';
import fsys from './botfs';
import Command from './command';
import { DiscordBot } from './discordbot';

/**
 * A discord object associated with this bot context.
 * Commands, classes, and data from this context
 * apply to the Discord ContextSource of the context.
 */
export type ContextSource = Channel | Guild | User;

/**
 * A class whose instances can be registered and associated with a BotContext.
 * A BotContext can have any number of associated ContextClass instances,
 * which pairs them to an underlying discord object such as a User, Guild, or Channel.
 * [ContextClass instances] <-> BotContext <-> ContextSource
 */
export type ContextClass<T extends ContextSource> = {
	new(context: BotContext<T>): any,
	load?(): any
};

/**
 * Base class for a BotContext.
 */
export abstract class BotContext<T extends ContextSource = ContextSource> {

	/**
	 * @property {string} type - 'guild', 'user', 'dm', 'channel'
	 */
	get type() { return 'unknown'; }

	private _idobj: T;

	/**
	 *
	 * idObject - discord obj whose id serves as context base.
	 */
	get idObject() { return this._idobj; }

	/**
	 * @property {string} sourceID - id of the discord object associated with this context.
	 */
	get sourceID() { return this._idobj.id; }

	/**
	 * @property {DisordBot} bot
	 */
	readonly bot: DiscordBot;

	readonly cache: ArchCache;

	/**
	 * Maps class-names to class instances.
	 */
	readonly _instances: Map<string, InstanceType<ContextClass<ContextSource>>> = new Map();

	/**
	 * @property {Access} access - Information about access to settings and commands.
	 */
	get access() { return this._access; }
	set access(v) { this._access = v; }

	get afs() { return afs; }
	get botfs() { return fsys; }

	private _access?: Access;

	/**
	 * @param {DiscordBot} bot
	 * @param {discord object} idobj - guild, channel, or user
	 * that acts as the basis for the context.
	 * @param {Cache} cache
	 */
	constructor(bot: DiscordBot, idobj: T, cache: ArchCache) {

		this.bot = bot;
		this._idobj = idobj;

		this.cache = cache;

	}

	/**
	 * Load Context preferences, init Context classes required
	 * by plugins.
	 * @async
	 * @param {ContextClass<T>[]} plugClasses
	 * @returns {Promise}
	 */
	async init(plugClasses: ContextClass<ContextSource>[]) {

		for (let i = plugClasses.length - 1; i >= 0; i--) {
			this.addClass(plugClasses[i]);
		}

		const roomPerms = await this.cache.fetch('access');
		this.access = new Access(roomPerms);

	}

	/**
	 * Backup the Context's cache.
	 * @async
	 * @param {Message} m
	 * @returns {Promise}
	 */
	async doBackup() {
		return this.cache.backup(0);
	}

	/**
	 * Return access permission string for the given command.
	 * @param {string} cmd
	 * @returns {string}
	 */
	accessInfo(cmd: string) {
		return this.access?.accessInfo(cmd);
	}

	/**
	 *
	 * @param {string} cmd
	 */
	unsetAccess(cmd: string) {
		this.access?.unsetAccess(cmd);
	}

	/**
	 *
	 * @param {string} cmd
	 * @param {number|string} perm
	 * @returns {boolean}
	 */
	setAccess(cmd: string, perm: PermissionResolvable) {
		return this.access?.setAccess(cmd, perm);
	}

	/**
	 *
	 * @param {string} cmd
	 */
	getAccess(cmd: string) {
		return this.access?.getAccess(cmd);
	}

	/**
	 *
	 * @param {string} cmd
	 * @param {GuildMember} gm
	 * @returns {boolean}
	 */
	canAccess(cmd: string, gm: GuildMember) {
		return this._access?.canAccess(cmd, gm);
	}

	/**
	 * Save this context's command permissions.
	 * @async
	 * @returns {Promise}
	 */
	async savePerms() {
		await this.cache.store('access', this.access);
	}

	/**
	 * Cache access without forcing write to disk.
	 */
	cachePerms() {
		this.cache.cache('access', this.access);
	}

	/**
	 * @async
	 * @param {string} key
	 * @param {*} value
	 * @returns {Promise<*>}
	 */
	async setSetting(key: string, value?: any) {

		const settings = await this.cache.fetch('settings') ?? {};

		settings[key] = value;
		this.cache.cache('settings', value);

	}

	/**
	 * @async
	 * @param {string} key
	 * @param {string} defaultset - value to return if setting not found.
	 * @returns {Promise<*|undefined>}
	 */
	async getSetting(key: string, defaultset?: string) {

		const settings = await this.cache.fetch('settings');

		if (!settings || !settings.hasOwnProperty(key)) return defaultset;
		return settings[key];

	}

	/**
	 * Tests if a file name or cache-key is illegal.
	 * @param {string} s
	 * @returns {boolean}
	 */
	isValidKey(s: string) {

		const a = fsys.illegalChars;
		for (let i = a.length - 1; i >= 0; i--) {
			if (s.indexOf(a[i]) >= 0) return false;
		}
		return true;

	}

	/**
	 * Check if Discord User is the bot owner.
	 * @param {Discord.User|string} u
	 * @returns {boolean}
	*/
	isOwner(u: User | string) { return this.bot.isOwner(u); }

	/**
	 * Register message event with Discord client.
	 * @param {function} listener
	 */
	onMsg(listener: (m: Message) => void) {

		this.bot.client.on('messageCreate', (m: Message) => {

			if (m.author.id === m.client.user?.id) return;

			if (this.bot.spamblock(m)) return;

			// ignore bot commands. (commands routed separately)
			if (m.content.charAt(0) === this.bot.cmdPrefix) return;

			const t = this.type;
			if (t === 'guild') {
				if (!m.guild || m.guild.id !== this._idobj.id) return;
			} else if (t === 'channel') {
				if (m.channel.id !== this._idobj.id) return;
			} else if (t === 'user') {
				if (m.author.id !== this._idobj.id) return;
			}

			listener(m);

		});
	}

	/**
	 * Returns an array of all files stored at a data path.
	 * ( path is relative to the context's save directory. )
	 * File extensions are not included.
	 * @async
	 * @param {string} path
	 * @returns {Promise<string[]>}
	 */
	async getDataList(path: string) {

		const files = await afs.readfiles(fsys.BaseDir + this.cache.cacheKey + path);
		for (let i = files.length - 1; i >= 0; i--) {

			files[i] = files[i].replace(/.[^/.]+$/, '');;

		}

		return files;

	}

	/**
	 * Displays standard user not found message to the given
	 * channel.
	 * @param {Discord.Channel|Discord.Message} obj
	 * @param {string} user
	 */
	sendUserNotFound(obj: TextBasedChannel | Message, user: string) {

		if (obj instanceof Message) return obj.reply('User \'' + user + '\' not found.');
		else return obj.send('User \'' + user + '\' not found.');

	}

	/**
	 * Attempts to find a user in the given Context.
	 * An error message is sent on failure.
	 */
	userOrSendErr(resp: TextBasedChannel | Message, name?: string) {

		if (!name) {
			(resp instanceof Message) ? resp.reply('User name expected.') : resp.send('User name expected.');
			return null;
		}
		const member = this.findUser(name);
		if (!member) this.sendUserNotFound(resp, name);

		return member;

	}

	/**
	 * @async
	 * @param {string} id - discord user id.
	 * @return {Promise<string>}
	 */
	async displayName(id?: string) {

		if (!id) return 'Invalid ID';

		try {
			return (await this.bot.client.users.fetch(id)).username;
		} catch {
		}
		return "Unknown User";

	}

	/**
	 * Get a display name for user.
	 * @param {(string|Discord.User|Discord.GuildMember)} o
	 * @returns {string}
	 */
	userString(o: string | User | GuildMember) {

		if (typeof o === 'string') return o;
		if (o instanceof User) return o.username;
		if (o instanceof GuildMember) return o.displayName;

	}

	async getUser(id: string) {
		try {
			/// fetch checks cache first.
			return await this.bot.client.users.fetch(id);
		} catch {
			return null;
		}
	}

	async getChannel(id: string) {
		try {
			/// fetch checks cache first.
			return await this.bot.client.channels.fetch(id);
		} catch {
			return null;
		}
	}

	/**
	 * Override in botcontext subclasses to find named user within context.
	 * @param {string} name
	 * @returns {null} overridden in subclasses.
	 */
	findUser(name: string): User | GuildMember | null {

		name = name.toLowerCase();
		return this.bot.client.users.cache.find(v => v.username === name) ?? null;

	}



	/**
	 * Find channel by name. (Not channel Id.)
	 * @param {string} name
	 */
	findChannel(name: string): Channel | null {
		return null;
	}

	/**
	 * Adds a class to be instantiated for the given context,
	 * if an instance does not already exists.
	 * @async
	 * @param {class} cls
	 * @returns {Promise<Object>}
	 */
	async addClass(cls: ContextClass<ContextSource>): Promise<InstanceType<ContextClass<ContextSource>>> {

		if (this._instances.get(cls.name)) {
			console.log('class ' + cls.name + ' already exists for ' + this.idObject.id);
			return this._instances.get(cls.name)!;
		}

		const inst = new cls(this);

		if ('load' in inst && typeof inst.load === 'function') {
			await inst.load();
		}

		this._instances.set(cls.name, inst);

		return inst;

	}


	/**
	 * Add a context instance.
	 * @param {Object} inst - plugin instance for this context.
	 */
	addInstance(inst: ContextClass<T>) {
		this._instances.set(inst.constructor.name, inst);
	}

	/**
	 * @async
	 * @param {Command} cmd
	 * @param {Array} args
	 * @returns {Promise}
	 */
	async routeCommand(cmd: Command, args: any[]) {

		//console.time( cmd.name );

		let target = this._instances.get(cmd.instClass.name);
		if (!target) {
			target = await this.addClass(cmd.instClass);
			if (!target) {
				console.error('Missing command target: ' + cmd.instClass);
				return null;
			}
		}

		return cmd.func.apply(target, args);

		//console.timeEnd( cmd.name );

	}

	/**
	 * Create a context subcache mapped by key.
	 * @param {string} key
	 * @returns {Cache} - The Cache object.
	 */
	subcache(key: string) { return this.cache.subcache(key); }

	/**
	 * Returns the key which should be used to refer to a data path in the cache.
	 * @param {*[]} objs - objs are idables or cache path strings.
	 * @returns {string}
	 */
	getDataKey(...objs: any[]) {

		const len = objs.length;
		const keys = [];
		for (let i = 0; i < len; i++) {

			const pt = objs[i];
			if (typeof pt === 'string') keys.push(pt);
			else keys.push(pt.id);

		}
		// todo: maybe use path.resolve instead?
		return keys.join('/');

	}

	/**
	 * @async
	 * @param {string} key
	 * @returns {Promise}
	 */
	async deleteData(key: string) {
		return this.cache.delete(key);
	}

	/**
	 * Caches data without writing to disk.
	 * @param {string} key
	 * @param {*} data
	 */
	cacheData(key: string, data: any) {
		this.cache.cache(key, data);
	}

	/**
	 * Attempts to retrieve data from cache without
	 * checking backing store.
	 * @param {string} key
	 * @returns {*}
	 */
	getData(key: string) { return this.cache.get(key); }

	/**
	 * Fetch keyed data.
	 * @async
	 * @param {string} key
	 * @returns {Promise<*>}
	 */
	async fetchData(key: string) { return this.cache.fetch(key); }

	/**
	 * Set keyed data.
	 * @async
	 * @param {string} key
	 * @param {*} data
	 * @param {boolean} [forceSave=false] Whether to force a save to the underlying data store.
	 * @returns {Promise}
	 */
	async storeData(key: string, data: any, forceSave: boolean = false) {

		if (forceSave) return this.cache.store(key, data);
		else return this.cache.cache(key, data);

	}

}

export class UserContext extends BotContext<User> {

	/**
	 * {string}
	 */
	get type() { return 'user'; }

	/**
	 * {string}
	 */
	get name() { return this.idObject.username; }

	/**
	 *
	 * @param {string} name
	 */
	findUser(name: string) {

		if (this.idObject.username.toLowerCase() === name.toLowerCase()) {
			return this.idObject;
		}
		return null;

	}

}

export class GuildContext extends BotContext<Guild> {
	/**
	 * {string}
	 */
	get type() { return 'guild'; }
	/**
	 * {string}
	 */
	get name() { return this.idObject.name; }

	/**
	 *
	 * @param {string} id
	 */
	async displayName(id: string) {

		if (!id) return 'Invalid ID';

		try {
			/// Note: fetch() takes caching into account.
			return (await this.idObject.members.fetch(id)).displayName;
		} catch (e) { }

		return 'Unknown User';

	}

	/**
	 * Send message to a text channel.
	 * @param channelId 
	 * @param message 
	 * @returns 
	 */
	async send(channelId: string, message: string) {
		const channel = await this.getChannel(channelId);
		if (channel && channel.isTextBased()) {
			return channel.send(message);
		}
	}

	async getChannel(id: string) {
		try {
			/// fetch checks cache first.
			return await this.idObject.channels.fetch(id);
		} catch {
			return null;
		}
	}


	/**
	 * Find channel by name.
	 * @param name 
	 * @returns 
	 */
	findChannel(name: string) {

		name = name.toLowerCase();
		return this.idObject.channels.cache.find(c => c.name.toLowerCase() === name) ?? null;
	}

	/**
	 *
	 * @param {string} name - GuildMember display name of user to find.
	 */
	findUser(name: string) {

		name = name.toLowerCase();
		return this.idObject.members.cache.find(gm =>
			gm.displayName.toLowerCase() === name || gm.nickname?.toLowerCase() === name || gm.user.username === name || gm.id === name
		) ?? null;

	}

}