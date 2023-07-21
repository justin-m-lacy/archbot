import { archGet } from "../../src/utils/fetch";
import { Message } from "discord.js";
import { DiscordBot } from '../../src/bot/discordbot';

const ApiUrl = "https://meowfacts.herokuapp.com/";

export const init = (bot: DiscordBot) => {

	bot.dispatch.add('meow', 'meow', cmdGetFact, { maxArgs: 0, hidden: true });

}

async function cmdGetFact(m: Message, query?: string) {

	if (query) {
		return;
	}

	try {
		const res = await archGet(ApiUrl);
		const data = await JSON.parse(res).data;

		const result = `${data[0]}`;
		return m.channel.send(result);

	} catch (err) {
		return m.channel.send(`Somethings wrong meow. - ${err};`)
	}

}