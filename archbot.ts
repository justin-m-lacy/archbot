import { Activity, Client, GuildMember, GatewayIntentBits, Presence } from 'discord.js';

import { UserHistory } from './src/history';
import { DiscordBot } from './src/bot/discordbot';
import { initBasicCommands, mergeMember } from './src/base-commands';
import { Auth } from '@src/bot/auth';
import "dotenv/config";

// Ensure current working directory is directory of the base script.
process.chdir(__dirname);

// init bot
const client: Client = new Client({

	closeTimeout: 4000,
	intents: [GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.GuildMessageReactions

	],
	sweepers: {
		messages: {
			interval: 1000,
			lifetime: 600
		}
	}
});
client.on('presenceUpdate', presenceUpdate);
client.on('error', err => {
	console.error('Connection error: ' + err.message);
});
client.on('shardError', error => {
	console.error('Websocket connection error:', error);
});

console.log('client created.');

const initBot = () => {

	const auth = require('./auth.json') as Auth;

	console.log(`running directory: ${__dirname}`);
	try {
		const bot = new DiscordBot(client, auth, __dirname);
		initBasicCommands(bot);
		tryLogin(auth);

		return bot;

	} catch (e) {
		console.error(e);
	}


}

initBot()!;

function tryLogin(auth: Auth) {

	console.log(`logging in with mode: ${process.env.NODE_ENV ?? 'dev'}`);
	client.login((process.env.NODE_ENV !== 'production' && auth.dev != null) ? auth.dev?.token ?? auth.token : auth.token);


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