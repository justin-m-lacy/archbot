import { Client, GatewayIntentBits } from 'discord.js';

import { DiscordBot } from './src/bot/discordbot';
import { initBasicCommands } from './src/base-commands';
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
	GatewayIntentBits.DirectMessages,
	GatewayIntentBits.GuildEmojisAndStickers,
	GatewayIntentBits.GuildModeration,
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

client.on('error', err => {
	console.error('Connection error: ' + err.message);
});
client.on('shardError', error => {
	console.error('Websocket connection error:', error);
});

console.log('client created.');

const initBot = () => {

	const auth = require('./auth.json') as Auth;

	console.log(`base directory: ${__dirname}`);
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

	console.log(`login with mode: ${process.env.NODE_ENV ?? 'dev'}`);
	client.login((process.env.NODE_ENV !== 'production' && auth.dev != null) ? auth.dev?.token ?? auth.token : auth.token);


}