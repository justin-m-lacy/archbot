import { DiscordBot } from '@src/bot/discordbot';
import { Message, TextBasedChannel } from 'discord.js';
import { AiMode, getNovelAiClient, loginNovelAi, NovelAiClient } from './novelai-client';
import { BotContext } from '@src/bot/botcontext';
import Cache from 'archcache';
import { ChannelStory } from './channel-story';

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

        this.createClient();
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

            const result = await story.loadOrCreateStory();
            if (result) {
                this.cache.cache(channel.id, result);
            }

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
     * Create story for the server.
     */
    async loadOrCreateStory(channelId: string) {

        if (!this.client) return;

        const entry = await this.cache.fetch(this.context.idObject.id) as StoryEntry;
        if (entry != null && entry.contentId) {

            console.log(`Loading cached story: ${entry}`);

            try {
                if (await this.client.loadStoryContent(entry.contentId)) {
                    console.log(`Channel story content loaded: ${channelId}`);
                }
            } catch (err) {

                // TODO: only create on a 404?
                this.createServerStory(channelId);

            }

        } else {
            this.createServerStory(channelId);
        }

    }

    private async createServerStory(channelId: string) {

        try {

            const channel = (await this.context.getChannel(channelId));

            const result = await this.client!.createStory(channelId, {
                title: (channel && channel.isTextBased() && 'name' in channel) ? channel.name : `Story: ${channelId}`
            });
            if (result) {
                console.log(`story created:`);
                console.dir(result);
                //this.cache.cache('storyid', result.id);
            } else {
                console.log(`failed to create story`);
            }

        } catch (err) {
            console.warn(`createStory(): ${err}`);
        }

    }
    cmdGenImage(m: Message, query: string) {

    }

    async cmdStory(m: Message, query: string) {

        //const story = await this.getChannelStory(m.channel);

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

    const configuration = {

        username: process.env.NOVEL_AI_USER ?? '',
        password: process.env.NOVEL_AI_PW ?? '',
        accessToken: process.env.NOVEL_AI_ACCESS_TOKEN,
    };

    bot.addContextCmd('story', 'story [prompt]', NovelAiPlugin.prototype.cmdStory, NovelAiPlugin,
        { minArgs: 1, maxArgs: 1, group: 'right', "alias": "st" });

    bot.addContextCmd('clearstory', 'clearstory', NovelAiPlugin.prototype.cmdClearStory, NovelAiPlugin,
        { minArgs: 1, maxArgs: 1, group: 'right' });

    bot.addContextCmd('clearchat', 'clearchat', NovelAiPlugin.prototype.cmdClearChat, NovelAiPlugin,
        { minArgs: 1, maxArgs: 1, group: 'right' });

    bot.addContextCmd('talk', 'talk [prompt]',
        NovelAiPlugin.prototype.cmdTalk, NovelAiPlugin,
        { minArgs: 1, maxArgs: 1, group: 'right', alias: 't' });

    accessPromise = loginNovelAi(configuration);

}