import { DiscordBot } from '@src/bot/discordbot';
import { Message, TextBasedChannel } from 'discord.js';
import { AiMode, getNovelAiClient, loginNovelAi, NovelAiClient, NovelAIConfig } from './novelai-client';
import { BotContext } from '@src/bot/botcontext';
import Cache from 'archcache';
import { ChannelStory } from './channel-story';

const configuration: NovelAIConfig = {

    username: process.env.NOVEL_AI_USER ?? '',
    password: process.env.NOVEL_AI_PW ?? '',

};

type StoryEntry = {
    storyId?: string,
    contentId?: string,
    meta: string
}

/**
 * Resolves after successful login with API accessToken.
 */
let accessPromise: Promise<{ accessToken: string, encryptionKey: Uint8Array } | undefined>;


/*async function getOpenAi(){
    return client ?? (client = await loginNovelAi(process.env.NOVEL_AI_USER ?? '',process.env.NOVEL_AI_PW ?? ''));
}*/

class NovelAiPlugin {

    private client: NovelAiClient | undefined = undefined;

    private readonly cache: Cache

    private readonly context: BotContext;

    private stories: Map<string, ChannelStory> = new Map();

    constructor(context: BotContext) {

        this.context = context;

        /// stories associated with this room.
        this.cache = context.subcache('novelai');

        this.createClient().then(() => this.loadOrCreateStory(context.idObject.id));
    }

    async getChannelStory(channel: TextBasedChannel) {

        let story = this.stories.get(channel.id);
        if (!story) {

            const entry = await this.cache.fetch(channel.id) as StoryEntry;

            story = new ChannelStory({
                channel: channel,
                client: this.client!,
                storyId: entry?.storyId,
                contentId: entry?.contentId

            })
            this.stories.set(channel.id, story);

        }
        return story;
    }

    async createClient() {

        try {
            const tokenAndCryptKey = await accessPromise;
            if (tokenAndCryptKey) {

                this.client = getNovelAiClient(
                    tokenAndCryptKey.accessToken,
                    tokenAndCryptKey.encryptionKey);


                await this.client.loadKeystore();
            }
        } catch (e) {
            console.log(`Failed to create NovelAi client.`);
        }
    }

    /**
     * Create story for this room.
     */
    async loadOrCreateStory(channelId: string) {

        if (!this.client) return;

        const storyid = await this.cache.fetch('storyid');
        if (storyid != null) {

            console.log(`Loading cached story: ${storyid}`);

            try {
                if (await this.client.loadStoryContent(storyid)) {
                    console.log(`Channel story content loaded: ${channelId}`);
                }
            } catch (err) {

                // TODO: only create on a 404?
                this.createStory(channelId);

            }

        } else {
            this.createStory(channelId);
        }

    }

    private async createStory(channelId: string) {

        try {

            /*const channel = (await this.context.getChannel(channelId));

            const result = await this.client!.createStory(channelId, {
                title: (channel && channel.isTextBased() && 'name' in channel) ? channel.name : `Story: ${channelId}`
            });
            if (result) {
                console.log(`story created:`);
                console.dir(result);
                //this.cache.cache('storyid', result.id);
            } else {
                console.log(`failed to create story`);
            }*/

        } catch (err) {
            console.warn(`createStory(): ${err}`);
        }

    }
    cmdGenImage(m: Message, query: string) {

    }

    async cmdStory(m: Message, query: string) {

        const result = await this.client?.generate(query, AiMode.Story);

        if (result) {
            return m.channel.send(result);
        } else return m.channel.send("I can't think of any story.");

    }

    /**
     * Clear story history.
     */
    async cmdClearStory(m: Message) {

        try {
            await this.client?.clearStory();
            return m.channel.send('Cleared');
        } catch (e) {
            return m.channel.send('Clear story failed.');
        }
    }

    /**
     * Clear chat history.
     */
    async cmdClearChat(m: Message) {

        try {
            await this.client?.clearChat();
            return m.channel.send('Cleared');
        } catch (e) {
            return m.channel.send('Clear story failed.');
        }
    }


    async cmdTalk(m: Message, query: string) {

        const result = await this.client?.generate(`[[${m.member?.nickname}]]: ${query}`, AiMode.Chat);

        if (result) {
            return m.channel.send(result);
        } else return m.channel.send("I don't feel like talking.");

    }

}

export const initPlugin = (bot: DiscordBot) => {

    bot.addContextCmd('story', 'story [prompt]', NovelAiPlugin.prototype.cmdStory, NovelAiPlugin,
        { minArgs: 1, maxArgs: 1, group: 'right', "alias": "st" });

    bot.addContextCmd('clearstory', 'clearstory', NovelAiPlugin.prototype.cmdClearStory, NovelAiPlugin,
        { minArgs: 1, maxArgs: 1, group: 'right' });

    bot.addContextCmd('clearchat', 'clearchat', NovelAiPlugin.prototype.cmdClearChat, NovelAiPlugin,
        { minArgs: 1, maxArgs: 1, group: 'right' });

    bot.addContextCmd('talk', 'talk [prompt]',
        NovelAiPlugin.prototype.cmdTalk, NovelAiPlugin,
        { minArgs: 1, maxArgs: 1, group: 'right', alias: 't' });

    accessPromise = loginNovelAi(process.env.NOVEL_AI_USER ?? '', process.env.NOVEL_AI_PW ?? '');

}