import { Message } from 'discord.js';
import { DiscordBot } from '@src/bot/discordbot';
import { getSenderName } from '@src/utils/users';

let results: string[];
let bot: DiscordBot;


async function cmdFight(m: Message, uname?: string) {

	if (!results) results = require('./results.json');
	if (!uname) return m.channel.send('You attack the darkness!');

	const target = bot.findUser(m.channel, uname);
	const attacker = getSenderName(m);

	if (!target)
		return m.channel.send('I don\'t see ' + uname + ' here. So you must be talking to me. Are you talking to me?');

	/*else if ( target.presnce == 'offline')
		return m.channel.send(attacker + ' is only brave enough to fight ' + uname + ' when they aren\'t here. How sad.');*/

	else if (target.id === m.author.id)
		return m.channel.send(attacker + ' self flagellates.');

	else if (target.id === bot.client.user!.id)
		return m.channel.send(bot.client.user!.username + ' throws down ' + attacker + ' and smites their ruin upon the mountainside.');

	else {

		const ind = Math.floor(results.length * Math.random());
		const result = results[ind].replace(/%t/g, uname).replace(/%a/g, attacker);

		return m.channel.send(result);

	}

}

export const initPlugin = (b: DiscordBot) => {

	bot = b;
	b.dispatch.add('fight', 'fight [user]', cmdFight, { maxArgs: 1 });

}
