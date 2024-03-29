import { DiscordBot } from '@src/bot/discordbot';
import { BotContext, ContextSource } from '@src/bot/botcontext';
import { Message } from 'discord.js';

class Quoter {

	private readonly context: BotContext<ContextSource>;

	/**
	 * quote data is lazily loaded on first command.
	 * TODO: Store quote creator and timestamp.
	 */
	private quotes: string[] | null;

	constructor(context: BotContext<any>) {

		this.quotes = null;
		this.context = context;

	}

	/**
	 *
	 * @param {Message} m
	 * @returns {Promise}
	 */
	async cmdQuote(m: Message) {

		if (!this.quotes) await this.loadQuotes();

		const len = this.quotes?.length ?? 0;
		if (len > 0) {

			const str = this.quotes![Math.floor(Math.random() * len)];
			return m.channel.send(str);

		}
		return m.channel.send('There are no quotes for this server.');

	}

	/**
	 *
	 * @param {*} m
	 * @param  {...any} args
	 * @returns {Promise}
	 */
	async cmdNewQuote(m: Message, ...args: string[]) {

		if (!this.quotes) await this.loadQuotes();

		const q = args.join(' ').trim();
		// todo: allow attachments.
		if (q === null || q === '') {
			return m.reply("Your silence is not memorable.");
		}

		this.quotes!.push(q);

		this.context.storeData('quoter/quotes', this.quotes);

	}

	async loadQuotes() {

		try {
			const q = await this.context.fetchData('quoter/quotes');

			if (q) {

				if (this.quotes == null) this.quotes = q;
				else this.quotes = this.quotes.concat(q);

			} else this.quotes = [];

		} catch (e) { console.log(e); this.quotes = []; }

	}

}

export const initPlugin = (bot: DiscordBot) => {

	bot.addContextCmd('quote', 'quote', Quoter.prototype.cmdQuote, Quoter);
	bot.addContextCmd('mkquote', 'mkquote ["stupid quote"]', Quoter.prototype.cmdNewQuote, Quoter);

}