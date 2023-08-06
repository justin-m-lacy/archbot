import { DiscordBot } from "@src/bot/discordbot";
import { Message } from "discord.js";

var answers: string[];

export const initPlugin = (bot: DiscordBot) => {

	bot.dispatch.add('8ball', '8ball [question]', cmd8Ball, { maxArgs: 1 });

}

function cmd8Ball(m: Message) {

	if (!answers) answers = require('./answers.json');
	if (answers.length === 0) return;

	const ind = Math.floor(answers.length * Math.random());
	m.channel.send(answers[ind]);

}