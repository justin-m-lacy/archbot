import { Activity, Client, GuildMember, Intents, Presence } from 'discord.js';

import auth from './auth.json';
import { UserHistory } from './src/history';
import { InitBot } from './src/bot/discordbot';
import { initBasicCommands, mergeMember } from './src/base-commands';

// init bot
const client: Client = new Client({

	intents: [Intents.FLAGS.GUILDS,
	Intents.FLAGS.DIRECT_MESSAGES,
	Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
	Intents.FLAGS.GUILD_MEMBERS,
	Intents.FLAGS.GUILD_MESSAGES,
	Intents.FLAGS.GUILD_PRESENCES,
	Intents.FLAGS.GUILD_MESSAGE_REACTIONS

	],
	sweepers: {
		messages: {
			interval: 1000,
			lifetime: 600
		}
	}
});

console.log('client created.');

const initBot = () => {

	try {
		var bot = InitBot(client, auth);
		initBasicCommands(bot);

		return bot;

	} catch (e) {
		console.error(e);
	}


}

initBot()!;


client.on('presenceUpdate', presenceUpdate);
client.on('error', err => {
	console.error('Connection error: ' + err.message);
});

console.log('logging in...');
client.login((process.env.NODE_ENV !== 'production' && auth.dev) ? auth.dev.token || auth.token : auth.token);



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
 * @param  oldActs
 * @param  newActs
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