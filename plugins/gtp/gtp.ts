import { Message } from 'discord.js';
/*import { Configuration, OpenAIApi  } from 'openai';

const configuration = new Configuration({

    organization:process.env.OPEN_AI_ORG ?? '',
    apiKey:process.env.OPEN_AI_KEY ?? ''

});*/

class ChatGtpPlugin {

    private openai?:any;

    getOpenAi(){
        return null; //this.openai ?? new OpenAIApi(configuration);
    }

    cmdAsk(m: Message, query: string ){

    }
}

/*export const init = (bot: DiscordBot) => {

	bot.addContextCmd('ask', 'ask [anything]',
    ChatGtpPlugin.prototype.cmdAsk, ChatGtpPlugin, { minArgs: 1, maxArgs: 1, group: 'right' });

}*/