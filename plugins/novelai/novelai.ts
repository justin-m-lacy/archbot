import { DiscordBot } from '@src/bot/discordbot';
import { Message } from 'discord.js';
import { getNovelAiClient, loginNovelAi, NovelAIConfig } from './novelai-api';

const configuration:NovelAIConfig = {

    username:process.env.NOVEL_AI_USER ?? '',
    password:process.env.NOVEL_AI_PW ?? '',

};

let client:ReturnType<typeof getNovelAiClient>|undefined = undefined;

async function getOpenAi(){
    return client ?? (client = await loginNovelAi(process.env.NOVEL_AI_USER ?? '',process.env.NOVEL_AI_PW ?? ''));
}

class NovelAiPlugin {


    cmdGenImage(m: Message, query: string ){

    }

    async cmdGenerate(m:Message, query:string){

        const result = await client?.generate(query);

        if ( result ) {
            return m.reply(result );
        } else return m.reply("I don't feel like talking.");

    }

}

export const init = (bot: DiscordBot) => {

    getOpenAi();

	bot.addContextCmd('gen', 'gen [image description]',
        NovelAiPlugin.prototype.cmdGenImage, NovelAiPlugin,
        { minArgs: 1, maxArgs: 1, group: 'right' });

    bot.addContextCmd('talk', 'talk [prompt]',
        NovelAiPlugin.prototype.cmdGenerate, NovelAiPlugin,
        { minArgs: 1, maxArgs: 1, group: 'right' });

}