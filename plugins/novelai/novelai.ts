import { DiscordBot } from '@src/bot/discordbot';
import { Message } from 'discord.js';
import { AiMode, getNovelAiClient, loginNovelAi, NovelAIConfig } from './novelai-api';

const configuration:NovelAIConfig = {

    username:process.env.NOVEL_AI_USER ?? '',
    password:process.env.NOVEL_AI_PW ?? '',

};

let accessTokenPromise:Promise<string|undefined>;


/*async function getOpenAi(){
    return client ?? (client = await loginNovelAi(process.env.NOVEL_AI_USER ?? '',process.env.NOVEL_AI_PW ?? ''));
}*/

class NovelAiPlugin {

    private client:ReturnType<typeof getNovelAiClient>|undefined = undefined;

    constructor(){

        this.createClient();
    }

    async createClient(){

        try{
            const token = await accessTokenPromise;
            if ( token ) {
                this.client = getNovelAiClient(token );

                await this.client?.getStories();


            }
        } catch(e){
            console.log(`Failed to create NovelAi client.`);
        }
    }

    cmdGenImage(m: Message, query: string ){

    }

    async cmdTale(m:Message, query:string){

        const result = await this.client?.generate(query, AiMode.Story);

        if ( result ) {
            return m.channel.send(result );
        } else return m.channel.send("I can't think of any story.");

    }

    async cmdTalk(m:Message, query:string){

        const result = await this.client?.generate( `[[${m.member?.nickname}]]: ${query}`, AiMode.Chat);

        if ( result ) {
            return m.channel.send(result );
        } else return m.channel.send("I don't feel like talking.");

    }

}

export const init = (bot: DiscordBot) => {

    accessTokenPromise = loginNovelAi(process.env.NOVEL_AI_USER ?? '',process.env.NOVEL_AI_PW ?? '');;

    bot.addContextCmd('tale', 'tale [prompt]', NovelAiPlugin.prototype.cmdTale, NovelAiPlugin,
    { minArgs: 1, maxArgs: 1, group: 'right', alias:'s' });

    bot.addContextCmd('talk', 'talk [prompt]',
        NovelAiPlugin.prototype.cmdTalk, NovelAiPlugin,
        { minArgs: 1, maxArgs: 1, group: 'right', alias:'t'});

}