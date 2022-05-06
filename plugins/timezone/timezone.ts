import { Message } from "discord.js";
import { DiscordBot } from '../../src/bot/discordbot';
import { IncomingMessage } from 'http';
const promisify = require('../../jsutils').promisify;
const promiseGet = promisify(require('http').get);

/**
 * Allow display of other timezones using world time zone API.
 * @url http://worldtimeapi.org/
 */

const TimeApiUrl = "http://worldtimeapi.org/api/timezone/";

export const init = (bot: DiscordBot) => {

	bot.dispatch.add('timezone', 'timezone [place]', cmdGetTime, { maxArgs: 1 });

}

async function cmdGetTime(m: Message, query?: string) {

	if (!query) {
		/// TODO: this actually returns a list of available timezones.
		return;
	}


	var res: IncomingMessage = await promiseGet(TimeApiUrl + query);

	if (res.statusCode !== 200) {

		res.resume();
		return m.reply(`Unknown timezone format.`);

	} else {

		let data = '';
		res.on('data', (chunk: any) => {
			data += chunk;
		});

		await promisify(res.on, res)('end');

		const json = JSON.parse(data);
		const date = new Date(json.datetime);
		return m.reply(`${date.toLocaleTimeString()}`);

	}

}