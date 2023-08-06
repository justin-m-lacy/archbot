import { DiscordBot } from '@src/bot/discordbot';
import { Message } from 'discord.js';
import { AiMode, getNovelAiClient, loginNovelAi, NovelAIConfig } from './novelai-client';
import { BotContext } from '@src/bot/botcontext';
import Cache from 'archcache';

const configuration:NovelAIConfig = {

    username:process.env.NOVEL_AI_USER ?? '',
    password:process.env.NOVEL_AI_PW ?? '',

};

type StoryEntry = {
    id:string,
    meta:string
}

/**
 * Resolves after successful login with API accessToken.
 */
let accessPromise:Promise<{accessToken:string, encryptionKey:Uint8Array}|undefined>;


/*async function getOpenAi(){
    return client ?? (client = await loginNovelAi(process.env.NOVEL_AI_USER ?? '',process.env.NOVEL_AI_PW ?? ''));
}*/

class NovelAiPlugin {

    private client:ReturnType<typeof getNovelAiClient>|undefined = undefined;

    private cache:Cache

    constructor( context:BotContext){

        /// stories associated with this room.
        this.cache = context.subcache('novelai');

        this.createClient().then( ()=>this.loadOrCreateStory( context.idObject.id ) );
    }

    async createClient(){

        try{
            const tokenAndCryptKey = await accessPromise;
            if ( tokenAndCryptKey ) {

                this.client = getNovelAiClient(
                    tokenAndCryptKey.accessToken,
                    tokenAndCryptKey.encryptionKey );

                
                    await this.client.loadKeystore();
            }
        } catch(e){
            console.log(`Failed to create NovelAi client.`);
        }
    }

    /**
     * Create story for this room.
     */
    async loadOrCreateStory( channelId:string ){

        if (!this.client) return;

        const storyid = this.cache.get('storyid');
        if ( storyid != null ) {

            await this.client.loadStoryContent(storyid);
        } else {

            const result = await this.client.createStory( channelId );
            if ( result ) {
                console.log(`story created: ${result}`);
            }

        }


    }

    cmdGenImage(m: Message, query: string ){

    }

    async cmdStory(m:Message, query:string){

        const result = await this.client?.generate(query, AiMode.Story);

        if ( result ) {
            return m.channel.send(result );
        } else return m.channel.send("I can't think of any story.");

    }

    /**
     * Clear story history.
     */
    async cmdClearStory(m:Message){

        try {
            await this.client?.clearStory();
            return m.channel.send('Cleared');
        } catch(e){
            return m.channel.send('Clear story failed.');
        }
    }

        /**
         * Clear chat history.
         */
        async cmdClearChat(m:Message){

            try {
                await this.client?.clearChat();
                return m.channel.send('Cleared');
            } catch(e){
                return m.channel.send('Clear story failed.');
            }
        }
    

    async cmdTalk(m:Message, query:string){

        const result = await this.client?.generate( `[[${m.member?.nickname}]]: ${query}`, AiMode.Chat);

        if ( result ) {
            return m.channel.send(result );
        } else return m.channel.send("I don't feel like talking.");

    }

}

export const initPlugin = (bot: DiscordBot) => {

    bot.addContextCmd('story', 'story [prompt]', NovelAiPlugin.prototype.cmdStory, NovelAiPlugin,
    { minArgs: 1, maxArgs: 1, group: 'right', alias:'s' });

    bot.addContextCmd('clearstory', 'clearstory', NovelAiPlugin.prototype.cmdClearStory, NovelAiPlugin,
    { minArgs: 1, maxArgs: 1, group: 'right' });

    bot.addContextCmd('clearchat', 'clearchat', NovelAiPlugin.prototype.cmdClearChat, NovelAiPlugin,
    { minArgs: 1, maxArgs: 1, group: 'right' });

    bot.addContextCmd('talk', 'talk [prompt]',
        NovelAiPlugin.prototype.cmdTalk, NovelAiPlugin,
        { minArgs: 1, maxArgs: 1, group: 'right', alias:'t'});
        
    accessPromise = loginNovelAi(process.env.NOVEL_AI_USER ?? '',process.env.NOVEL_AI_PW ?? '');

}