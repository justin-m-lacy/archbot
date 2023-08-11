import { DiscordBot } from "@src/bot/discordbot";
import { Message, ChannelType } from 'discord.js';
import { PickWordsError, IWolfPlugin, NotEnoughPlayersError, GamePhaseError, UserNotInGameError, AlreadyInGameError, GameNotJoinedError } from './types';
import { BotContext } from '@src/bot/botcontext';
import { WolfWordGame } from "./word-wolf-game";

class WordWolfPlugin implements IWolfPlugin{

    private gamesByChannel:Map<string,WolfWordGame> = new Map();

    private context:BotContext;

    constructor( context:BotContext){
        this.context = context;
    }

    getUser(id: string) {
        return this.context.getUser(id)
    }

    gameEnded( game:WolfWordGame){

        this.gamesByChannel.delete(game.channelId);

    }

    async cmdJoin( m :Message ){

        this.context.findUser("ruin");
        try {

            const game = this.getOrCreateGame(m)!;
            game.join(m.author.id);

            return m.channel.send(`${m.author.username} has joined the game.`);
    
        } catch (err){

            if ( err instanceof AlreadyInGameError){

                m.reply("You are already in this game.");

            } else if ( err instanceof GamePhaseError ){

                m.reply("Game already in progress.");

            } else if ( err instanceof PickWordsError) {

                m.reply("Insufficient game data.")
            } else {
                m.reply("Unable to join game.");
            }
        }

    }

    /**
     * Attempt to start game.
     * @param m 
     */
    async cmdStart( m:Message ){

        const game = this.getGame(m);

        if ( game ){

            try {
                game.tryStart();

            } catch (err){

                if ( err instanceof NotEnoughPlayersError){
                    m.reply("Not enough players have joined.");
                } else if ( err  instanceof GamePhaseError){
                    m.reply("A Game is already in progress.");
                } else {
                    m.reply("Can't start game. Not sure why.");
                }
            }

        } else {
            console.log(`game not found.`);
        }

    }

    async cmdVote( m:Message, who:string ){

        const game = this.getGame(m);

        if ( game ){

            try {

                const user = await this.context.findUser(who);
                if ( !user ){
                    return m.reply(`User '${who}' not found.`);
                }
                
                game.vote(m.author.id, user.id);

                if ( game.votingDone()){
                    this.completeGame(game);
                }
             
            } catch (err){

                if ( err instanceof GameNotJoinedError ){
                    return m.reply("You have not in the active game.");
                } else if ( err instanceof GamePhaseError) {
                   return m.reply("It's not time to vote right now.");
                } else if ( err instanceof UserNotInGameError) {
                    return m.reply(`User '${who}' is not in the game.`);
                }
                return m.reply("Could not vote. I don't know why.");
            
            }

        }


    }

    private async completeGame(game:WolfWordGame){

        await this.sendVoteResult(game);
        game.reset();

    }

    async sendVoteResult( game:WolfWordGame ){

        const channel = this.context.findChannel(game.channelId);
        if ( !channel || !channel.isTextBased()) {

            console.warn(`WolfGame vote for missing channel: ${game.channelId}`);
            return;
        }

        const wolfName = await this.context.displayName( game.wolfPlayer );
        if (!wolfName ){
            return channel.send(`The wolf player is missing.`);
        } else {

            if ( game.wolfFound){
                return channel.send(`Voting has ended. The wolf has been found.\n${wolfName} was the wolf and will lose unless they can guess the majority word.`);
            } else {
                return channel.send(`Voting has ended. The wolf has been found.\n${wolfName} was the wolf and has won the game.`);
            }
        }

    }

    getGame(m:Message){

        const game = this.gamesByChannel.get(m.channelId);
        if ( !game ) m.reply("Game not found.");
        return game;
    }

    getOrCreateGame(m:Message, ){

            const id = m.channel.id;
            let curGame = this.gamesByChannel.get(id);
            if ( !curGame && m.channel.type === ChannelType.GuildText){
                curGame = new WolfWordGame( this, id, m.channel.name );
                this.gamesByChannel.set(id, curGame);
            }

            return curGame;

    }

}

export const initPlugin = (bot:DiscordBot)=>{

    bot.addContextCmd('wolf', 'Join wolf game.', WordWolfPlugin.prototype.cmdJoin, WordWolfPlugin,
    { maxArgs:0, });

    bot.addContextCmd('wolfstart', 'Start wolf game.', WordWolfPlugin.prototype.cmdStart, WordWolfPlugin,
    { maxArgs:0, });

    bot.addContextCmd('wolfvote', '!wolfvote [player]',
        WordWolfPlugin.prototype.cmdVote,
        WordWolfPlugin,
        { minArgs: 1, maxArgs: 1, group: 'right' });


}