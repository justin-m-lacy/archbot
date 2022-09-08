import { fetch } from "../../src/utils/fetch";
import { Message } from "discord.js";
import { DiscordBot } from '../../src/bot/discordbot';

const ApiUrl = "https://animechan.vercel.app/api/random";

export const init = (bot: DiscordBot) => {

	bot.dispatch.add('aquote', 'aquote - get inspirational anime quote.', cmdGetQuote, { maxArgs: 0 });

}

async function cmdGetQuote(m: Message, query?: string) {

	if (query) {
		return;
	}

	try {
		const res = await fetch(ApiUrl);
		const data = await JSON.parse(res);

		const result = `"${data.quote}" - ${data.character} (${data.anime})`;
		return m.channel.send(result);

	} catch (err) {
		return m.channel.send(`Shinji gave up - ${err};`)
	}

}