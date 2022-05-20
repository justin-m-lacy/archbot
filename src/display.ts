import Discord, { Message, TextBasedChannel } from 'discord.js';

export const Display = {

	CONTENT_MAX: 1600,

	capsRegEx: /(?:\b(\w*)\b)*/g,

	sendAll: async (ch: TextBasedChannel, strings: string[]) => {

		for (let i = 0; i < strings.length; i++) {
			ch.send(strings[i]);
		}
	},

	blockText: (s: string) => '```' + s + '```',

	sendEmbed: async (m: Message, s: string, e: string) => {

		return m.reply({
			content: '```' + s + '```',
			embeds: [new Discord.MessageEmbed({ image: { url: e } })]
		});

	},

	sendBlock: async (m: Message, s: string) => m.reply('```' + s + '```'),

	/**
	  * Check if character is a vowel.
	* @param {string} c - character to test.
	* @returns {boolean}
	  */
	isVowel: (c: string) => {

		c = c.toLowerCase();
		return c === 'a' || c === 'e' || c === 'i' || c === 'o' || c === 'u';

	},

	/**
	 *
	 * @param {string} str
	 * @returns {string}
	 */
	capitalize(str: string) {

		return str.replace(this.capsRegEx, (sub) => {
			return sub[0].toUpperCase() + sub.slice(1);
		});

	},

	/**
 * Gets the total number of pages that would be required to display
 * the text, given the maximum message size.
 * @param {string} text
 * @returns {number} one-based page count.
 */
	pageCount(text: string) {
		return Math.floor(text.length / this.CONTENT_MAX) + 1;
	},

	/**
	 * Makes a standard page count string for the given text.
	 * @param {string} text
	 * @returns {string} Information about the number of pages required.
	 */
	pageFooter(text: string) {
		let count = this.pageCount(text);
		return '( ' + count + ' page result' + (count != 1 ? 's )' : ' )');
	},

	/**
	 * Break the text into pages based on the maximum content length,
	 * and return the indicated page of text.
	 * @param {string} text
	 * @param {number} page - zero-based page index.
	 * @returns {string} - a single page of text out of the total.
	 */
	getPageText(text: string, page: number = 0) {
		return text.slice(this.CONTENT_MAX * page, this.CONTENT_MAX * (page + 1));
	},

	/**
	 * Break a message text into pages, and send it to the required message channel.
	 * @param {Discord.Message} m
	 * @param {string} text - text to paginate and send.
	 * @param {number} page - zero-based page of text to be sent.
	 */
	async sendPage(m: Message, text: string, page: number = 0) {
		return m.channel.send(this.getPageText(text, page) + '\n\n' + this.pageFooter(text));
	},

	/**
	 * Break a message text into pages, and reply the page to the given message.
	 * @param {Message} m
	 * @param {string} text - text to paginate and reply.
	 * @param {number} page - zero-based page of text to reply.
	 */
	async replyPage(m: Message, text: string, page: number = 0) {
		return m.reply(this.getPageText(text, page) + '\n\n' + this.pageFooter(text));
	},

	/**
	 * Paginates an array of text to only break between items.
	 * @param {string[]} items
	 * @param {number} [page=0] the zero-based index of the page of text to display.
	 * @returns { {page:string, pages:number} } text of page and total page count.
	 */
	paginate(items: string[], page: number = 0) {

		let it, len = items.length;
		let chars = 0;

		// item indices for breaking the current page.
		let totalPages = 0, pageStart = 0;
		let pageStr = '';

		for (let i = 0; i < len; i++) {

			it = items[i];
			chars += it.length;

			// adding this item's text crossed a page boundary.
			if (chars >= this.CONTENT_MAX) {

				if (totalPages === page) pageStr = items.slice(pageStart, i).join('\n');

				totalPages++;
				pageStart = i;
				chars = it.length;

			}

		} // for

		return { page: pageStr, pages: totalPages + 1 };
	}

}