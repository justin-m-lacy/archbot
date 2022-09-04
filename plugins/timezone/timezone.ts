import { Message } from "discord.js";
import { DiscordBot } from '../../src/bot/discordbot';
import { fetch } from '../../src/utils/fetch';

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


	try {

		var data = await fetch(TimeApiUrl + query);

		const json = JSON.parse(data);
		const date = new Date(json.datetime);
		return m.reply(`${date.toLocaleTimeString()}`);

	} catch (err) {

		return m.reply(`Failed to fetch timezone: ${err}`);
	}

}