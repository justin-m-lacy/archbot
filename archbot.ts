import Discord, { Activity, Client, GuildMember, Intents, Message, Presence, TextBasedChannel, User } from 'discord.js';
import auth from './auth.json';
import { UserHistory } from './src/history';

const DateFormat = require('./src/datedisplay');
const dice = require('archdice');
const jsutils = require('./src/jsutils');
const DiscordBot = require('./src/bot/discordbot');

// init bot
const client: Client = new Discord.Client({

	intents: [Intents.FLAGS.GUILDS,
	Intents.FLAGS.DIRECT_MESSAGES,
	Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
	Intents.FLAGS.GUILD_MEMBERS,
	Intents.FLAGS.GUILD_MESSAGES,
	Intents.FLAGS.GUILD_PRESENCES,
	Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
	sweepers: {
		messages: {
			interval: 1000,
			lifetime: 600
		}
	}
});

console.log('client created.');

try {
	var bot = DiscordBot.InitBot(client, auth);
	console.log('bot created.');
} catch (e) {
	console.error(e);
}

initCmds();

client.on('presenceUpdate', presenceUpdate);
client.on('error', err => {
	console.error('Connection error: ' + err.message);
});

console.log('logging in...');
client.login((process.env.NODE_ENV !== 'production' && auth.dev) ? auth.dev.token || auth.token : auth.token);


function initCmds() {

	let cmds = bot.dispatch;

	cmds.add('help', 'help <cmd>', cmdHelp, { maxArgs: 1, module: 'default' });

	cmds.add('schedule', 'schedule <activity> <times>', cmdSchedule, { maxArgs: 2, group: 'right', module: 'default' });

	cmds.add('sleep', 'sleep <sleep schedule>', cmdSleep, { maxArgs: 1, module: 'default' });
	cmds.add('when', 'when <userName> <activity>', cmdWhen, { maxArgs: 2, module: 'default' });
	cmds.add('roll', '!roll [n]d[s]', cmdRoll, { maxArgs: 1, module: 'default' });

	cmds.add('uid', 'uid <username>', cmdUid, { maxArgs: 1, module: 'default' });
	cmds.add('uname', 'uname <nickname>', cmdUName, { maxArgs: 1, module: 'default' });
	cmds.add('nick', 'nick <displayName>', cmdNick, { maxArgs: 1, module: 'default' });
	cmds.add('uptime', 'uptime', cmdUptime);

	cmds.add('lastplay', '!lastplay <userName> <gameName>', cmdLastPlay, { maxArgs: 2, module: 'default' });
	cmds.add('laston', 'laston <userName>', cmdLastOn, { maxArgs: 1, module: 'default' });
	cmds.add('lastidle', 'lastidle <userName>', cmdLastIdle, { maxArgs: 1, module: 'default' });
	cmds.add('lastactive', 'lastactive <userName>', cmdLastActive, { maxArgs: 1, module: 'default' });
	cmds.add('lastoff', 'lastoff <userName>', cmdLastOff, { maxArgs: 1, module: 'default' });

	cmds.add('offtime', 'offtime <userName>', cmdOffTime, { maxArgs: 1, module: 'default' });
	cmds.add('ontime', 'ontime <username>', cmdOnTime, { maxArgs: 1, module: 'default' });
	cmds.add('idletime', 'idletime <username>', cmdIdleTime, { maxArgs: 1, module: 'default' });
	cmds.add('playtime', 'playtime <userName>', cmdPlayTime, { maxArgs: 1, module: 'default' });

	cmds.add('magicmissile', 'You need material components for all of your spells.',
		(m: Message) => m.channel.send('You attack the darkness.'), { hidden: true, module: 'magic' });
	cmds.add('palantir', 'What does the Great Eye command?', (m: Message) => m.channel.send('Build me an army worthy of Mordor.'), { hidden: true, module: 'orthanc' });
	cmds.add('ranking', 'ranking', cmdRanking, { hidden: true, maxArgs: 0 });
	cmds.add('fuck', null, cmdFuck, { hidden: true, module: 'explicit' });

	cmds.add('test', 'test [ping message]', cmdTest, { maxArgs: 1, module: 'default' });

}

const cmdRanking = async (m: Message) => { return m.channel.send('Last place: garnish.'); }

const cmdUptime = async (m: Message) => {
	return m.channel.send(
		client.user!.username + ' has reigned for ' + DateFormat.timespan(client.uptime));
}

/**
 * @async
 * @param {Message} msg
 * @param {string} name
 * @returns {Promise}
 */
const cmdUName = async (msg: Message, name: string) => {

	let gMember = bot.userOrSendErr(msg.channel, name);
	if (!gMember) return;
	return msg.channel.send(name + ' user name: ' + gMember.user.username)

}

/**
 * @async
 * @param {Message} msg
 * @param {string} name
 * @returns {Promise}
 */
const cmdNick = async (msg: Message, name: string) => {

	let gMember = bot.userOrSendErr(msg.channel, name);
	if (!gMember) return;
	return msg.channel.send(name + ' nickname: ' + gMember.nickname)

}

/**
 *
 * @param {Message} msg
 * @param {string} [cmd] command to get help for.
 */
const cmdHelp = (msg: Message, cmd?: string) => {

	if (!cmd) return bot.printCommands(msg.channel);
	else return bot.printCommand(msg.channel, cmd);

}

/**
 * @async
 * @param {Message} msg
 * @param {string} name
 * @returns {Promise}
 */
const cmdUid = async (msg: Message, name: string) => {

	let gMember = bot.userOrSendErr(msg.channel, name);
	if (!gMember) return;
	return msg.channel.send(name + ' uid: ' + gMember.user.id)

}

/**
 * @async
 * @param {Discord.Message} msg
 * @param {string} dicestr - roll formatted string.
 * @returns {Promise}
 */
const cmdRoll = async (msg: Message, dicestr: string) => {

	try {
		let sender = bot.getSender(msg);
		let total = dice.parseRoll(dicestr);
		return msg.channel.send(bot.displayName(sender) + ' rolled ' + total);
	} catch (err) {

		if (err instanceof RangeError) {
			return msg.channel.send("Don't be a dick.");
		}
		return msg.channel.send('Dice format must be: xdy+z');

	}


}

/**
 *
 * @param {Message} msg
 * @param {string} when
 */
const cmdSleep = (msg: Message, when: string) => {
	let sender = bot.getSender(msg);
	setSchedule(sender, 'sleep', when);
}

/**
 *
 * @param {Message} msg
 * @param {string} activity
 * @param {string} when
 */
const cmdSchedule = (msg: Message, activity: string, when: string) => {

	let sender = bot.getSender(msg);
	setSchedule(sender, activity, when);
	return msg.channel.send('Scheduled ' + activity + ' for ' + bot.displayName(sender));

}

const cmdWhen = (msg: Message, who: string, activity: string) => {
	return sendSchedule(msg.channel, who, activity);
}

const cmdLastPlay = (msg: Message, who: string, game: string) => {
	return sendGameTime(msg.channel, who, game);
}

/**
 *
 * @param {Message} msg
 * @param {string} who - user to check.
 */
const cmdLastOn = (msg: Message, who: string) => {
	sendHistory(msg.channel, who, ['online', 'idle', 'dnd'], 'online');
}

/**
 *
 * @param {Message} msg
 * @param {string} who - user to check.
 */
const cmdLastIdle = (msg: Message, who: string) => {
	sendHistory(msg.channel, who, 'idle');
}

/**
 *
 * @param {Message} msg
 * @param {string} who - user to check.
 */
const cmdLastActive = (msg: Message, who: string) => {
	sendHistory(msg.channel, who, 'online', 'active');
}

/**
 *
 * @param {Message} msg
 * @param {string} who - user to check.
 */
const cmdLastOff = (msg: Message, who: string) => {
	sendHistory(msg.channel, who, 'offline');
}

/**
 *
 * @param {Message} msg
 * @param {string} reply
 */
const cmdTest = (msg: Message, reply: string) => {
	if (reply == null) return msg.channel.send('eh?');
	else if (msg.member) return msg.channel.send(reply + ' yourself, ' + msg.member.displayName);
}

const cmdFuck = (m: Message) => {
	if (m.member) {
		m.channel.send(m.content.slice(1) + ' yourself, ' + m.member.displayName);
	}
}

const sendGameTime = async (channel: TextBasedChannel, displayName: string, gameName: string) => {

	let uObject = bot.userOrSendErr(channel, displayName);
	if (!uObject) return;

	if (uObject.presence.game && uObject.presence.game.name === gameName) {
		return channel.send(displayName + ' is playing ' + gameName);
	}

	try {

		let data = await bot.fetchUserData(uObject);
		let games = data.games;

		let dateStr = DateFormat.dateString(games[gameName]);
		return channel.send(displayName + ' last played ' + gameName + ' ' + dateStr);

	} catch (err) {
		console.error(err);
		return channel.send(gameName + ': No record for ' + displayName + ' found.');
	}

}

/**
 *
 * @param {Message} msg
 * @param {string} name
 */
const cmdPlayTime = async (msg: Message, name: string) => {

	let chan = msg.channel;
	let gMember = bot.userOrSendErr(chan, name);
	if (!gMember) return;

	if (!gMember.presence.game) return chan.send(name + ' is not playing a game.');

	let gameName = gMember.presence.game.name;

	try {

		let data = await bot.fetchUserData(gMember);
		if (data.hasOwnProperty('games') && data.games.hasOwnProperty(gameName)) {
			let lastTime = data.games[gameName];
			return chan.send(name + ' has been playing ' + gameName + ' for ' + DateFormat.elapsed(lastTime));
		}

	} catch (err) {
		console.error(err);
	}
	return chan.send('I do not know when ' + name + '\'s game started.');

}

/**
 *
 * @param {Message} msg
 * @param {string} name
 */
const cmdIdleTime = async (msg: Message, name: string) => {

	let chan = msg.channel;
	let gMember = bot.userOrSendErr(chan, name);
	if (!gMember) return;

	if (!hasStatus(gMember, 'idle')) return chan.send(name + ' is not idle.');

	try {

		let history = await readHistory(gMember);
		if (history) {

			let lastTime = latestStatus(history, ['offline', 'dnd', 'online']);

			if (lastTime) return chan.send(name + ' has been idle for ' + DateFormat.elapsed(lastTime));

		}

	} catch (err) {

		console.error(err);
	}

	return chan.send('I do not know when ' + name + ' went idle.');

}

/**
 *
 * @param {Message} msg
 * @param {string} name
 */
const cmdOnTime = async (msg: Message, name: string) => {

	let chan = msg.channel;

	let gMember = bot.userOrSendErr(chan, name);
	if (!gMember) return;

	if (hasStatus(gMember, 'offline')) return chan.send(name + ' is not online.');

	try {

		let history = await readHistory(gMember);
		if (history) {

			let lastTime = latestStatus(history, 'offline');

			if (lastTime) return chan.send(name + ' has been online for ' + DateFormat.elapsed(lastTime));

		}

	} catch (err) {

		console.error(err);
	}

	return chan.send('I do not know when ' + name + ' came online.');

}

/**
 * @async
 * @param {Message} msg
 * @param {string} name
 * @returns {Promise}
 */
const cmdOffTime = async (msg: Message, name: string) => {

	let chan = msg.channel;

	let gMember = bot.userOrSendErr(chan, name);
	if (!gMember) return;

	if (!hasStatus(gMember, 'offline')) return chan.send(name + ' is not offline.');

	try {

		let history = await readHistory(gMember);
		if (history) {

			let lastTime = latestStatus(history, 'offline');

			if (lastTime) return chan.send(name + ' has been offline for ' + DateFormat.elapsed(lastTime));

		}

	} catch (err) {

		console.log(err);
	}
	return chan.send('I do not know when ' + name + ' went offline.');

}

/**
 * Send status history of user to channel.
 * @async
 * @param {Channel} channel
 * @param {string} name - name of user to check.
 * @param {(string|string[])} statuses - status name or list of statuses to check.
 * @param {string} statusType - status to display.
 */
const sendHistory = async (channel: TextBasedChannel, name: string, statuses: string | string[], statusType?: string) => {

	let gMember = bot.userOrSendErr(channel, name);
	if (!gMember) return;

	if (!statusType) {
		if (typeof statuses === 'string') {
			statusType = statuses;
		} else {
			statusType = statuses.length > 0 ? statuses[0] : 'unknown';
		}
	}

	if (hasStatus(gMember, statuses)) return channel.send(name + ' is now ' + statusType + '.');

	try {

		let memData = await bot.fetchUserData(gMember);
		let lastTime = latestStatus(memData.history, statuses);

		let dateStr = DateFormat.dateString(lastTime);

		return channel.send('Last saw ' + name + ' ' + statusType + ' ' + dateStr);

	} catch (err) {
		return channel.send('I haven\'t seen ' + name + ' ' + statusType + '.');
	}

}

/**
 *
 * @param {GuildMember} gMember
 * @param {string[]|string} statuses
 * @returns {boolean}
 */
const hasStatus = (gMember: GuildMember, statuses: string | string[]) => {

	let status = gMember.presence?.status;
	if (Array.isArray(statuses)) {

		for (let i = statuses.length - 1; i >= 0; i--) {

			if (statuses[i] === status) return true;
		}
		return false;

	}
	return statuses === status;

}

/**
 * checks history object for last time user was in a given status
 * or in any of the statuses given in an array.
 * @param {Object} history
 * @param {string|string[]} statuses
 */
const latestStatus = (history: UserHistory | null | undefined, statuses: string | string[]) => {

	if (!history) return null;
	if (Array.isArray(statuses)) {

		let status = null;
		let statusTime = null;

		if (statuses.length === 0) { return null; }
		for (let i = statuses.length - 1; i >= 0; i--) {

			status = statuses[i];
			if (history.hasOwnProperty(status) === true) {
				statusTime = (!statusTime ? history[status] : Math.max(history[status], statusTime));
			}

		}
		return statusTime;

	} else if (typeof statuses === 'string') {

		if (history.hasOwnProperty(statuses) === true) return history[statuses];

	}
	return null;
}

/**
 * send schedule message to channel, for user with displayName
 * @async
 * @param {Channel} chan
 * @param {string} name
 * @param {string} activity
 * @returns {Promise}
 */
const sendSchedule = async (chan: TextBasedChannel, name: string, activity: string) => {

	let gMember = bot.userOrSendErr(chan, name);
	if (!gMember) return;

	let sched = await readSchedule(gMember, activity);
	if (sched) return chan.send(name + ' ' + activity + ': ' + sched);

	return chan.send('No ' + activity + ' schedule found for ' + name + '.');

}


/**
 * Get the history object of a guild member.
 * @async
 * @param {GuildMember} gMember
 * @returns {Promise<Object|null>}
 */
const readHistory = async (gMember: GuildMember) => {

	try {
		let data = await bot.fetchUserData(gMember);
		if (data && data.hasOwnProperty('history')) return data.history;
	} catch (e) {
		console.log(e);
	}
	return null;

}

/**
 * @async
 * @param {GuildMember} gMember - guild member to get schedule for.
 * @param {string} schedType - activity to read schedule for.
 * @returns {Promise}
 */
const readSchedule = async (gMember: GuildMember, schedType: string) => {

	try {

		let data = await bot.fetchUserData(gMember);
		if (data && data.hasOwnProperty('schedule')) return data.schedule[schedType];

	} catch (err) {
		console.error(err);
	}
	return null;

}

/**
 * Sets the schedule of a guild member, for a given schedule type.
 * @async
 * @param {GuildMember|User} uObject - Discord user.
 * @param {string} scheduleType - type of activity to schedule.
 * @param {string} scheduleString - schedule description.
 * @returns {Promise}
 */
const setSchedule = async (uObject: GuildMember | Discord.User, scheduleType: string, scheduleString: string) => {
	return mergeMember(uObject, { schedule: { [scheduleType]: scheduleString } });
}

/**
 *
 * @param {Presence} oldPres
 * @param {Presence} newPres
 */
async function presenceUpdate(oldPres: Presence | null, newPres: Presence) {

	// ignore bot events.
	if (newPres.userId === client.user?.id) return;

	if (!oldPres) {

		if (newPres.member != null) {
			await logHistory(newPres.member, [newPres.status]);
			await logActivities(newPres.member, undefined, newPres.activities);
		}

	} else if (oldPres.member) {

		let oldStatus = oldPres.status;
		let newStatus = newPres.status;

		/// statuses: 'offline', 'online', 'idle', 'dnd'
		if (newStatus !== oldStatus) await logHistory(oldPres.member, [oldStatus, newStatus]);
		await logActivities(oldPres.member, oldPres.activities, newPres.activities);

	}

}

/**
 *
 * @param {GuildMember} guildMember
 * @param {Discord.Activity[]} oldActs
 * @param {Discord.Activity[]} newActs
 */
const logActivities = async (guildMember: GuildMember, oldActs?: Activity[], newActs?: Activity[]) => {

	let now = Date.now();
	var gameData: UserHistory = {};

	if (oldActs) {

		for (let i = oldActs.length - 1; i >= 0; i--) {
			if (!oldActs[i]) {
				oldActs.splice(i, 1);
				continue;
			}
			gameData[oldActs[i].name] = now;
		}
	}

	if (newActs) {
		for (let i = newActs.length - 1; i >= 0; i--) {
			if (!newActs[i]) {
				newActs.splice(i, 1);
				continue;
			}
			gameData[newActs[i].name] = now;
		}
	}

	return mergeMember(guildMember, { activities: gameData });

}

/**
 * Log a guild member's last status within the guild.
 * @param {GuildMember} guildMember
 * @param {string[]} statuses
 */
const logHistory = async (guildMember: GuildMember, statuses: string[]) => {

	let now = Date.now();
	let history: UserHistory = {};
	for (var i = statuses.length - 1; i >= 0; i--) {
		//console.log( 'logging status: ' + statuses[i]);
		history[statuses[i]] = now;
	}

	return mergeMember(guildMember, { history: history });

}

/**
 * Merge existing user data.
 * @async
 * @param {GuildMember|User} uObject
 * @param {Object} newData - data to merge into existing data.
 * @returns {Promise}
 */
const mergeMember = async (uObject: GuildMember | User, newData: any) => {

	try {

		let data = await bot.fetchUserData(uObject);
		if (data && typeof data === 'object') {
			jsutils.recurMerge(data, newData);
			newData = data;
		}

		return bot.storeUserData(uObject, newData);

	} catch (e) {
		console.error(e);
	}

}