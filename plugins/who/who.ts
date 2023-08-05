import { Message } from 'discord.js';
import { DiscordBot } from '@src/bot/discordbot';

let responses: string[];

export const init = (bot: DiscordBot) => {

	bot.addCmd('who', 'who <condition>', cmdWho, { maxArgs: 1 });

}

const getResponse = () => {
	return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * @async
 * @param {Message} m
 * @param {string} msg - ignored question.
 * @returns {Promise}
 */
const cmdWho = async (m: Message, query?: string) => {

	if (!responses) responses = require('./responses.json');
	if (responses.length === 0) return;

	let resp = getResponse();
	let u, name;

	if (m.guild) {

		u = m.guild.members.cache.random();
		if (!u) {
			return m.channel.send(`It's too hard to pick.`);
		}
		name = u.nickname ?? u.displayName;
		return m.channel.send(resp.replace(/%t/g, name));

	} else return m.channel.send('It\'s you, I guess.');

}