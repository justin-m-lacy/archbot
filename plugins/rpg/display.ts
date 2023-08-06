import { Message, TextBasedChannel, EmbedBuilder } from "discord.js";
import Char from './char/char';

export const blockText = (s: string) => '```' + s + '```';

export const sendEmbed = async (m: Message, s: string, e: string) => m.reply({
	content: '```' + s + '```',
	embeds: [new EmbedBuilder({ image: { url: e } })]
});

export const sendBlock = async (m: Message, s: string) => m.reply('```' + s + '```');

/**
 * Checks if the character is a vowel.
 * @param {string} c - character to test. 
 */
export const isVowel = (c: string) => {

	c = c.toLowerCase();
	return c === 'a' || c === 'e' || c === 'i' || c === 'o' || c === 'u';
}

export const echoChar = async function (chan: TextBasedChannel, char: Char, prefix: string = '') {

	const namestr = char.name + ' is a';
	const desc = char.getLongDesc();
	return chan.send(prefix + '```' + namestr + (isVowel(desc.charAt(0)) ? 'n ' : ' ') + desc + '```');

}


export class Log {

	get text() { return this._text; }
	set text(v) { this._text = v; }

	private _text: string = '';
	constructor() { }

	/**
	 * Gets and clears the current log text.
	 * @returns {string} The current log text.
	 */
	getAndClear() {
		const t = this._text;
		this._text = '';
		return t;
	}

	log(str: string) { this._text += str + '\n'; }
	output(str: string = '') { return this._text + str; }
	clear() { this._text = ''; }

}