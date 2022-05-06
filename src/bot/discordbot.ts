import { Channel, Client, Guild, GuildMember, Message, TextBasedChannel, User } from "discord.js";
import { Auth } from './auth';
import Command from './command';

const fsys = require('./botfs.js');
const Dispatch = require('./dispatch.js');
const Cache = require('archcache');
const Discord = require('discord.js');
const path = require('path');

/**
 * @constant {number} CONTENT_MAX - maximum message size.
 */
export const CONTENT_MAX = 1905;

const Contexts = exports.Context = require('./botcontext.js');

var Bot: DiscordBot;

export const InitBot = (client: Client, auth: Auth) => {
	Bot = new DiscordBot(client, auth);
	return Bot;
}

export const GetBot = () => Bot;

export class DiscordBot {

	/**
	 * @property {DiscordClient}
	 */
	readonly client: Client;

	/**
	 * @property {Dispatch}
	 */
	get dispatch() { return this._dispatch; }

	/**
	 * @property {Object[string->BotContext]}
	 */
	get contexts() { return this._contexts; }

	/**
	 * @property {object[]} plugin classes to instantiate for each context.
	 */
	get contextClasses() { return this._contextClasses; }

	/**
	 * prefix that indicates an archbot command.
	 */
	readonly cmdPrefix: string = '!';

	/**
	 * The working directory of the program. defaults to the directory of the main script file.
	 */
	readonly directory: string;

	_saveDir!: string;

	/**
	 * @property {string} base save directory.
	 */
	get saveDir() { return this._saveDir; }

	readonly _dispatch: Dispatch;

	readonly cache: Cache;

	readonly _owner: string;
	readonly _admins?: string[];

	/**
	 *
	 * @param {Discord.Client} client
	 * @param {object} auth - authentication information object.
	 * @param {string} auth.owner - owner of bot.
	 * @param {string[]} auth.admins - accounts with authority to control bot.
	 * @param {string} [mainDir=null] - the main directory of the archbot program. Defaults to the directory of the main script
	 * being run.
	 */
	constructor(client: Client, auth: Auth, mainDir = null) {

		// map target discord obj to processing context.
		this._contexts = {};

		this.directory = mainDir || process.cwd();

		// classes to instantiate for each context.
		this._contextClasses = [];

		this.client = client;

		this.loadConfig();
		fsys.setBaseDir(this._saveDir);

		this.cache = new Cache({

			loader: fsys.readData,
			saver: fsys.writeData,
			checker: fsys.fileExists,
			deleter: fsys.deleteData

		});

		this._dispatch = new Dispatch(this.cmdPrefix);

		// maps id->context id.
		this.restoreProxies();

		this.loadPlugins();

		this._admins = auth.admins;
		this._owner = auth.owner;

		process.on('exit', () => this.onShutdown());
		process.on('SIGINT', () => this.onShutdown());

		client.setInterval(
			() => {

				try {
					this.cache.cleanup(60 * 1000 * 30);
				} catch (e) { console.error(e); }

			}, 60 * 1000 * 30);

		client.setInterval(
			() => {
				try {
					this.cache.backup(60 * 1000 * 15);
				} catch (e) { console.error(e); }
			}, 60 * 1000 * 15);

		this.initClient();

		this.addCmd('backup', 'backup', (m: Message) => this.cmdBackup(m),
			{ access: 0, access: Discord.Permissions.FLAGS.ADMINISTRATOR, immutable: true, module: 'default' });
		this.addCmd('archleave', 'archleave', (m: Message) => this.cmdLeaveGuild(m), {
			access: Discord.Permissions.FLAGS.ADMINISTRATOR
		});
		this.addCmd('archkill', 'archkill', (m: Message) => this.cmdBotQuit(m), { immutable: true });
		this.addCmd('proxyme', 'proxyme', (m: Message) => this.cmdProxy(m));
		this.addCmd('access', 'access cmd [permissions|roles]',
			(m: Message, cmd: string, perm) => this.cmdAccess(m, cmd, perm),
			{ minArgs: 1, access: Discord.Permissions.FLAGS.ADMINISTRATOR, immutable: true }
		);
		this.addCmd('resetaccess', 'resetaccess cmd',
			(m: Message, cmd: string) => this.cmdResetAccess(m, cmd),
			{ minArgs: 1, maxArgs: 1, access: Discord.Permissions.FLAGS.ADMINISTRATOR }
		);

	}

	/**
	 * Load config file.
	 */
	loadConfig() {

		try {

			let config = require('../archconfig.json');

			if (process.env.NODE_ENV !== 'production' && config.dev) {
				Object.assign(config, config.dev);
			}

			this._spamblock = config.spamblock || {};
			this.cmdPrefix = config.cmdprefix || '!';
			this._plugsdir = path.join(this.directory, config.pluginsdir);
			this._saveDir = path.join(this.directory, config.savedir || '/savedata/');


		} catch (e) {
			this.cmdPrefix = '!';
			this._spamblock = {};
		}

	}

	/**
	 * Attempt to load plugins.
	 */
	loadPlugins() {

		if (!this._plugsdir) return;

		try {

			var plugins = require('./plugsupport.js').loadPlugins(this._plugsdir);
			this.addPlugins(plugins);

		} catch (e) { console.error(e); }
	}

	/**
	 * @async
	 */
	async onShutdown() {
		if (this.client) {
			await this.cache.backup();
			this.client.destroy();
			this.client = null;

		}
		process.exit(1);
	}

	/**
	 *
	 * @param {Object[]} plug_files
	 */
	addPlugins(plug_files) {

		let plug, init;
		for (let i = plug_files.length - 1; i >= 0; i--) {

			plug = plug_files[i];
			init = plug.init;
			if (init && typeof (init) === 'function') {
				plug.init(this);
			}

		}

	}

	/**
	 * Add class that will be instantiated on every running
	 * context.
	 * @param {class} cls
	 */
	addContextClass(cls) {

		this._contextClasses.push(cls);

		// ensure context for every guild.
		if (this.client) {

			this.client.guilds.cache.forEach((g, id) => {

				this.getContext(g).then(c => {
					console.log('adding class: ' + cls.name)
					c.addClass(cls);
				});

			});

		}

	}

	initClient() {

		// NOTE: 'this' for events is always client.
		this.client.on('ready', () => this.initContexts());
		this.client.on('guildUnavailable', onGuildUnavail)

		this.client.on('resume', onResume);

		this.client.on('message', m => {

			if (m.author.id === this.client.user.id) return;
			this.onMessage(m);

		});

		this.client.on('presenceUpdate', onPresence);

	}

	initContexts() {

		console.log('client ready: ' + this.client.user.username + ' - (' + this.client.user.id + ')');

		try {
			let classes = this._contextClasses;
			if (classes.length === 0) {
				console.log('no classes to instantiate.');
				return;
			}

			this.client.guilds.cache.forEach((g, id) => {
				this.getContext(g);
			});
		} catch (e) { console.log(e); }

	}

	/**
	 * Add a command to the bot.
	 * @param {string} name
	 * @param {string} desc
	 * @param {Function} func
	 * @param {?Object} [opts=null]
	 */
	addCmd(name, desc, func, opts = null) {
		this._dispatch.add(name, desc, func, opts);
	}

	/**
	 * Add a command with a plugin class which is instantiated for each chat context.
	 * @param {string} name
	 * @param {string} desc
	 * @param {Function} func
	 * @param {Object} plugClass
	 * @param {?Object} [opts=null]
	 */
	addContextCmd(name, desc, func, plugClass, opts = null) {
		this._dispatch.addContextCmd(name, desc, func, plugClass, opts);
	}

	/**
	 *
	 * @param {Message} m
	 */
	async onMessage(m) {

		if (this.spamblock(m)) return;

		let command = this._dispatch.parseLine(m.content);

		if (!command) return;

		// check command access.

		let context = await this.getMsgContext(m);
		if (context) {
			if (m.member && this.testAccess(m, command, context) === false) return this.sendNoPerm(m, command);
		}

		if (command.isDirect === true) {

			this._dispatch.dispatch(command, [m]);

		} else if (context) {

			// context command.
			let error = this._dispatch.routeCmd(context, command, [m]);

			if (!error) return;
			else if (error instanceof Promise) {

				error.then(s => { if (s) return m.channel.send(s); }).catch(e => console.error(e));

			} else if (typeof error === 'string') {

				return m.channel.send(error);

			}

		}

	}

	/**
	 *
	 * @param {Message} m
	 * @param {Command} cmd
	 * @param {*} context
	 * @returns {boolean}
	 */
	testAccess(m: Message, cmd: Command, context) {

		let allowed = context.canAccess(cmd.name, m.member);
		if (allowed === undefined) {

			// check default access.
			if (!cmd.access) return true;
			return m.member.permissions.has(cmd.access);

		}

		return allowed;

	}

	/**
	 * Returns true if the given discord user is the bot owner.
	 * @param {Discord.User|string} u
	 * @returns {boolean}
	 */
	isOwner(u: User | string) {

		if (typeof u !== 'string') u = u.id;
		return (this._admins && this._admins.includes(u)) || u === this._owner;
	}

	/**
	 * Backup unsaved cache items.
	 * @async
	 * @param {Message} m
	 * @returns {Promise}
	 */
	async cmdBackup(m: Message) {

		if (this.isOwner(m.author.id)) {
			await this.cache.backup(0);
		} else {

			let context = this.getMsgContext(m);
			if (context) await this.context.doBackup();
		}
		return m.reply('backup complete.');

	}

	/**
	 * Close the running Archbot program. Owner only.
	 * @async
	 * @param {Message} m
	 * @returns {Promise}
	 */
	async cmdBotQuit(m: Message) {

		if (this.isOwner(m.author.id)) {
			this.client.destroy();
		}
		return this.sendNoPerm(m);

	}

	/**
	 * Make Archbot leave the current guild.
	 * @async
	 * @param {Message} m
	 * @returns {Promise}
	 */
	async cmdLeaveGuild(m: Message) {

		if (this.isOwner(m.author.id) && m.guild) {
			return m.guild.leave();
		}
		return this.sendNoPerm(m);

	}

	/**
	 *
	 * @param {Message} m
	 * @returns {boolean} returns true to block guild/channel.
	 */
	spamblock(m: Message) {

		if (!m.guild) return false;
		let allow = this._spamblock[m.guild.id];

		if (!allow) return false;
		if (allow[m.channel.id]) return false;

		return true;

	}

	/**
	 * Proxy the given context through the user's DM.
	 * @async
	 * @param {Message} m
	 * @returns {Promise}
	 */
	async cmdProxy(m: Message) {

		// get context of the guild/channel to be proxied to user.
		let context = await this.getMsgContext(m);

		this.setProxy(m.author, context);
		return m.author.send('Proxy created.');

	}

	/**
	 * Reset command's permissions to default.
	 * @async
	 * @param {Message} m
	 * @param {string} cmd - name of command.
	 * @returns {Promise}
	 */
	async cmdResetAccess(m: Message, cmd: string) {

		// unset any custom access.
		context.unsetAccess(cmd);
		return m.reply('Access reset.');

	}

	/**
	 * @async
	 * @param {Message} m
	 * @param {string} cmdName - name of command.
	 * @param {string} [perm=undefined]
	 * @returns {Promise}
	 */
	async cmdAccess(m: Message, cmdName: string, perm = undefined) {

		let cmd = this._dispatch.getCommand(cmdName);
		if (!cmd) return m.reply(`Command '${cmdName}' not found.`);
		else if (cmd.immutable) return m.reply(`The access level of Command '${cmdName}' is immutable.`);

		let context = await this.getMsgContext(m);
		if (perm === undefined || perm === null) {

			let info = context.accessInfo(cmdName);
			if (!info && info !== 0 && info !== '0') {

				// return default command access.
				if (!cmd.access) return m.reply('Anyone can use this command.');
				return m.reply(`Access for ${cmdName}: ${cmd.access}`);

			} else {

				return m.reply(`Access for ${cmdName}: ${info}`);

			}

		} else {

			context.setAccess(cmdName, perm);
			return m.reply('Access set.');

		}

	}

	/**
	 * Send a no-permission message.
	 * @async
	 * @param {Message} m
	 * @param {Command} [cmd=null]
	 * @returns {Promise}
	 */
	async sendNoPerm(m: Message, cmd = null) {

		if (cmd) return m.reply(`You do not have permission to use the command '${cmd.name}'`);
		return m.reply('You do not have permission to use that command.');

	}

	/**
	 * Proxy a Context to a user's PM.
	 * @param {User} user
	 * @param {BotContext} context
	 */
	setProxy(user, context) {

		this._contexts[user.id] = context;
		this._proxies[user.id] = context.sourceID;
		this.cacheData('proxies', this._proxies);

	}

	/**
	 * Save information about proxied contexts.
	 * @async
	 * @returns {Promise<*>}
	 */
	async saveProxies() {
		return this.storeData('proxies', this._proxies);
	}

	/**
	 * Restore proxies defined in proxies file.
	 * @async
	 * @returns {Promise}
	 */
	async restoreProxies() {

		this._proxies = {};
		let loaded = await this.fetchData('proxies');
		if (loaded) {
			this._proxies = Object.assign(this._proxies, loaded);
		}

	}

	/**
	 * Return a unique Context associated with a message channel.
	 * @async
	 * @param {Discord.Message} m
	 * @returns {Promise<BotContext>}
	 */
	async getMsgContext(m) {

		let type = m.channel.type, idobj;

		if (type === 'text' || type === 'voice ') idobj = m.guild;
		else {

			idobj = m.author;
			//check proxy
			if (this._proxies[idobj.id]) return this.getProxy(idobj, this._proxies[idobj.id]);

		}

		return this._contexts[idobj.id] || this.makeContext(idobj, type);

	}

	/**
	 * @async
	 * @param {*} idobj
	 * @param {string} type
	 * @returns {Promise<BotContext>}
	 */
	async getContext(idobj, type) {

		let proxid = this._proxies[idobj.id];
		if (proxid) return this.getProxy(idobj, proxid);

		return this._contexts[idobj.id] || this.makeContext(idobj, type);

	}

	/**
	 * Get a context from the source id, mapping messages
	 * to the destobj.
	 * @async
	 * @param {*} destobj
	 * @param {*} srcid
	 * @returns {Promise<BotContext>}
	 */
	async getProxy(destobj, srcid) {

		let con = this._contexts[srcid];
		if (con) return con;

		let proxob = await this.findProxTarget(srcid);
		if (proxob) return this.makeContext(proxob);

		// proxy not found.
		console.log('ERROR: Proxy not found: ' + srcid);
		return this._contexts[destobj.id] || this.makeContext(destobj);

	}

	/**
	 * Get the object associated with a Discord id.
	 * @param {string} id
	 * @returns {Guild|Channel}
	 */
	async findProxTarget(id) {
		return await this.client.guilds.fetch(id) || await this.client.channels.fetch(id);
	}

	/**
	 * @async
	 * @param {Discord.Base} idobj
	 * @param {string} type
	 * @returns {Promise<BotContext>}
	 */
	async makeContext(idobj, type) {

		console.log('create context for: ' + idobj.id);
		let context;

		if (type === 'text' || !type || type === 'voice')
			context = new Contexts.GuildContext(this, idobj, this.cache.subcache(fsys.getGuildDir(idobj)));
		else context = new Contexts.UserContext(this, idobj, this.cache.subcache(fsys.getUserDir(idobj)));

		await context.init(this._contextClasses);

		this._contexts[idobj.id] = context;

		return context;

	}

	/**
	 * Gets a displayName for a discord user.
	 * @param {GuildMember|User} uObject
	 * @returns {string}
	 */
	displayName(uObject) {
		if (uObject instanceof Discord.GuildMember) {
			return uObject.displayName;
		}
		return uObject.username;

	}

	/**
	 * Get the sender of a Message.
	 * @param {Message} msg
	 * @returns {GuildMember|User}
	 */
	getSender(msg) {

		if (msg.member) return msg.member;
		return msg.author;

	}

	/**
	 * fetch data for arbitrary key.
	 * @async
	 * @param {string} key
	 * @returns {Promise<*>}
	 */
	async fetchData(key) {
		return this.cache.fetch(key);
	}

	/**
	 * Store data for key.
	 * @async
	 * @param {string} key
	 * @param {*} data
	 * @returns {Promise}
	 */
	async storeData(key, data) {
		return this.cache.store(key, data);
	}

	/**
	 * Create a key to associate with a chain of Discord objects.
	 * @param {*} baseObj
	 * @param  {...any} subs
	 * @returns {string}
	 */
	getDataKey(baseObj, ...subs) {

		if (baseObj instanceof Discord.Channel) return fsys.channelPath(baseObj, subs);
		else if (baseObj instanceof Discord.GuildMember) return fsys.guildPath(baseObj.guild, subs);
		else if (baseObj instanceof Discord.Guild) return fsys.guildPath(baseObj, subs);

		return '';

	}

	/**
	 *
	 * @param {string} key
	 * @param {*} data
	 */
	cacheData(key, data) {
		this.cache.cache(key, data);
	}

	/**
	 * @async
	 * @param {GuildMember|User} uObject
	 * @returns {Promise<*>}
	 */
	async fetchUserData(uObject) {

		let objPath = (uObject instanceof Discord.GuildMember) ? fsys.memberPath(uObject)
			: objPath = fsys.getUserDir(uObject);

		return this.cache.fetch(objPath);

	}

	/**
	 *
	 * @param {Discord.User|Discord.GuildMember} uObject
	 * @param {*} data - user data to store.
	 */
	storeUserData(uObject: User | GuildMember, data: any) {

		let objPath = (uObject instanceof Discord.GuildMember) ? fsys.memberPath(uObject) :
			fsys.getUserDir(uObject);

		return this.cache.cache(objPath, data);

	}

	/**
	 * Finds and returns the named user in the channel,
	 * or replies with an error message.
	 * Function is intentionally not async since there is no reason
	 * to wait for the channel reply to go through.
	 * @param {Channel} channel
	 * @param {string} name
	 * @returns {}
	 */
	userOrSendErr(channel: TextBasedChannel, name?: string) {

		if (!name) {
			channel.send('User name expected.');
			return null;
		}
		let member = this.findUser(channel, name);
		if (!member) channel.send('User \'' + name + '\' not found.');
		return member;

	}

	/**
	 * Find a GuildMember or User object in the channel.
	 * @param {Discord.Channel} channel
	 * @param {string} name - name or nickname of user to find.
	 * @returns {(GuildMember|User|null)}
	 */
	findUser(channel, name) {

		if (!channel) return null;

		name = name.toLowerCase();
		switch (channel.type) {

			case 'text':
			case 'voice':

				return channel.guild.members.cache.find(

					gm =>
						gm.displayName.toLowerCase() === name || (
							gm.nickname && gm.nickname.toLowerCase() === name
						)
				);

			case 'dm':
				if (channel.recipient.username.toLowerCase() === name) return channel.recipient;
				return null;

		}

		return null;

	}

	/**
	 * @async
	 * @param {Channel} chan
	 * @param {string} cmdname
	 * @returns {Promise}
	 */
	async printCommand(chan, cmdname) {

		let cmds = this._dispatch.commands;
		if (cmds && cmds.hasOwnProperty(cmdname)) {

			let cmdInfo = cmds[cmdname];
			let usage = cmdInfo.usage;
			if (!usage) return chan.send('No usage information found for command \'' + cmdname + '\'.');
			else return chan.send(cmdname + ' usage: ' + cmdInfo.usage);


		} else return chan.send('Command \'' + cmdname + '\' not found.');

	}

	/**
	 * Lists the commands associated with a given plugin or module.
	 * @async
	 * @param {string} module
	 * @returns {Promise}
	 */
	async moduleCommands(module) {
	}

	/**
	 * @async
	 * @param {Channel} chan
	 * @returns {Promise}
	 */
	async printCommands(chan: TextBasedChannel) {

		let str = `Use ${this.cmdPrefix}help [command] for more information.\nAvailable commands:\n`;
		let cmds = this._dispatch.commands;

		if (cmds) {

			let a = [];
			let sep = ': ' + this._dispatch.prefix;

			//let info;
			for (let k in cmds) {

				if (!cmds[k].hidden) a.push(k + sep + cmds[k].desc);

			} //

			str += a.join('\n');

		}
		return chan.send(str, {
			split: {
				prepend: 'Help cont...\n'
			}
		});

	}

} // class

/**
 *
 * @param {GuildMember} oldGM
 * @param {GuildMember} newGM
 */
const onPresence = (oldGM: GuildMember, newGM: GuildMember) => {

	if (newGM.id === Bot.client.user.id) {
		if (newGame.presence.status === 'online') {
			console.log('bot now online in guild: ' + newGM.guild.name);
		}
	}
}

const onGuildUnavail = (g: Guild) => {
	console.log('guild unavailable: ' + g.name);
}

const onResume = (evtCount: number) => {
	console.log(`resuming. missed ${evtCount} events.`);
}

/*function onReady() {
	console.log( 'bot logged in as: ' + this.user.username );
}*/