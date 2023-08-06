import { BotContext, ContextSource } from '@src/bot/botcontext';
import { Message } from 'discord.js';
import { DiscordBot } from '@src/bot/discordbot';

type Info = { i: string, uid: string, t: number };


class InfoPlugin {

	private readonly context: BotContext<ContextSource>;
	private infos: { [subject: string]: Info };


	constructor(context: BotContext<ContextSource>) {

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

			const info = this.getInfo(subj);
			if (info) return m.reply(info);
			return m.reply('Information not found.');

		}

	}

	async cmdRmInfo(m: Message, subj: string) {

		if (!subj) return m.reply('Usage: !rminfo "subject"');

		const res = await this.rmInfo(subj);
		if (res) return m.channel.send('Information removed.');

		return m.channel.send('Information not found.');

	}

	/**
	 *
	 * @param {*} subj
	 * @param {*} which - Not yet implemented.
	 */
	async rmInfo(subj: string, which?: string) {

		subj = subj.toLowerCase();
		const cur = this.infos[subj];
		if (cur) {

			delete this.infos[subj];
			await this.context.storeData(this.getKey(), this.infos);
			return true;

		}

	}

	getInfo(subj: string) {
		return this.infos[subj]?.i ?? null;
	}

	async addInfo(subj: string, content: string, uid: string) {

		try {

			subj = subj.toLowerCase();
			//const cur = this.infos[subj];	//TODO: implement info lists?

			this.infos[subj] = { i: content, uid: uid, t: Date.now() };

			await this.context.storeData(this.getKey(), this.infos);

		} catch (e) { console.error(e); }

	}

	async loadInfos() {

		try {

			const infoData = await this.context.fetchData(this.getKey());
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