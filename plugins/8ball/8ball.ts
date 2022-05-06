import { Message } from "discord.js";

var answers: any;

export const init = (bot: DiscordBot) => {

	bot.dispatch.add('8ball', '8ball [question]', cmd8Ball, { maxArgs: 1 });

}

function cmd8Ball(msg: Message) {

	if (!answers) answers = require('./answers.json');
	if (answers.length === 0) return;

	let ind = Math.floor(answers.length * Math.random());
	msg.channel.send(answers[ind]);

}