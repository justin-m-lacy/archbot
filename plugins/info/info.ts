import { BotContext, ContextSource } from '@src/bot/botcontext';
import { Message } from 'discord.js';
import { DiscordBot } from '@src/bot/discordbot';

type Info = { i: string, uid: string, t: number };


class InfoPlugin {

	private readonly context: BotContext<ContextSource>;
	private infos: { [subject: string]: Info };


	constructor(context: BotContext<ContextSource>) {

		// TODO: Use Map or Object.create to prevent base object overwrites.
		this.infos = {};

		this.context = context;
		this.loadInfos();

	}

	getKey() { return this.context.getDataKey('info', 'info'); }

	async cmdInfo(m: Message, subj: string, newInfo?: string) {

		if (subj == null) return m.reply('Usage: !info "subj" "definition"');

		if (newInfo) {

			await this.addInfo(subj, newInfo, m.author.id);
			return m.channel.send('Ah, "' + subj + '" -> ' + newInfo);

		} else {

			let info = this.getInfo(subj);
			if (info) return m.reply(info);
			return m.reply('Information not found.');

		}

	}

	async cmdRmInfo(m: Message, subj: string) {

		if (!subj) return m.reply('Usage: !rminfo "subject"');

		let res = await this.rmInfo(subj);
		if (res) return m.channel.send('info removed.');

		return m.channel.send('Info not found.');

	}

	/**
	 *
	 * @param {*} subj
	 * @param {*} which - Not yet implemented.
	 */
	async rmInfo(subj: string, which?: string) {

		subj = subj.toLowerCase();
		let cur = this.infos[subj];
		if (cur) {

			delete this.infos[subj];
			await this.context.storeData(this.getKey(), this.infos);
			return true;

		}

	}

	getInfo(subj: string) {
		let cur = this.infos[subj];
		return cur ? cur.i : null;
	}

	async addInfo(subj: string, content: string, uid: string) {

		try {

			subj = subj.toLowerCase();
			let cur = this.infos[subj];	//TODO: implement info lists?

			this.infos[subj] = { i: content, uid: uid, t: Date.now() };

			await this.context.storeData(this.getKey(), this.infos);

		} catch (e) { console.error(e); }

	}

	async loadInfos() {

		try {

			let infoData = await this.context.fetchData(this.getKey());
			if (infoData) this.infos = infoData;
			else console.warn('Info data not found.');

		} catch (e) { console.error(e); }

	}

}


export const initPlugin = (bot: DiscordBot) => {

	bot.addContextCmd('info', 'info <subject> [definition]',
		InfoPlugin.prototype.cmdInfo, InfoPlugin, { minArgs: 1, maxArgs: 2, group: 'right' });
	bot.addContextCmd('rminfo', 'rminfo <subject> [definition]',
		InfoPlugin.prototype.cmdRmInfo, InfoPlugin, { minArgs: 1, maxArgs: 1, group: 'right' });

}