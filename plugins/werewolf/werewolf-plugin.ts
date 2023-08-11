import { WerewolfGame } from './werewolf-game';
import { AlreadyInGameError, GameNotJoinedError, GamePhaseError, NotEnoughPlayersError, UserNotInGameError } from './types';
import { DiscordBot } from "@src/bot/discordbot";
import { Message, ChannelType } from 'discord.js';
import { BotContext } from "@src/bot/botcontext";



class WerewolfPlugin {

    private gamesByChannel: Map<string, WerewolfGame> = new Map();

    private context: BotContext;

    constructor(context: BotContext) {
        this.context = context;
    }

    async cmdJoinGame(m: Message) {

        this.context.findUser("ruin");
        try {

            const game = this.getOrCreateGame(m)!;
            game.join(m.author.id);

            return m.channel.send(`${m.author.username} has joined the game.`);

        } catch (err) {

            if (err instanceof AlreadyInGameError) {

                m.reply("You are already in this game.");

            } else if (err instanceof GamePhaseError) {

                m.reply("Game already in progress.");

            } else {
                m.reply("Unable to join game.");
            }
        }

    }

    /**
     * Attempt to start game.
     * @param m 
     */
    async cmdStart(m: Message) {

        const game = this.getGame(m);

        if (game) {

            try {
                //  game.tryStart();

            } catch (err) {

                if (err instanceof NotEnoughPlayersError) {
                    m.reply("Not enough players have joined.");
                } else if (err instanceof GamePhaseError) {
                    m.reply("A Game is already in progress.");
                } else {
                    m.reply("Can't start game. Not sure why.");
                }
            }

        } else {
            console.log(`game not found.`);
        }

    }

    async cmdStealRole(m: Message, user: string) {
    }

    /**
     * Troublemaker swaps two other roles.
     */
    async cmdSwapRoles(m: Message, user1: string, user2: string) {
    }

    private async completeGame(game: WerewolfGame) {

    }

    getGame(m: Message) {

        const game = this.gamesByChannel.get(m.channelId);
        if (!game) m.reply("Game not found.");
        return game;
    }

    async cmdVote(m: Message, who: string) {

        try {

            const game = this.getGame(m);
            if (!game) return;

            const user = await this.context.findUser(who);
            if (!user) {
                return m.reply(`User '${who}' not found.`);
            }

            game.target(m.author.id, user.id);

        } catch (err) {

            if (err instanceof GameNotJoinedError) {
                return m.reply("You have not in the active game.");
            } else if (err instanceof GamePhaseError) {
                return m.reply("It's not time to vote right now.");
            } else if (err instanceof UserNotInGameError) {
                return m.reply(`User '${who}' is not in the game.`);
            }
            return m.reply("Could not vote. I don't know why.");

        }
    }

    getOrCreateGame(m: Message,) {

        const id = m.channel.id;
        let curGame = this.gamesByChannel.get(id);
        /*if (!curGame && m.channel.type === ChannelType.GuildText) {
            curGame = new WerewolfGame(this, id, m.channel.name);
            this.gamesByChannel.set(id, curGame);
        }*/

        return curGame;

    }

    gameEnded(game: WerewolfGame) {

        this.gamesByChannel.delete(game.channelId);

    }

}

export const initPlugin = (bot: DiscordBot) => {

    /* bot.addContextCmd('werewolf', 'Start wolf game.', WerewolfPlugin.prototype.cmdJoinGame, WerewolfPlugin, { maxArgs: 0, });
 
     bot.addContextCmd('weresteal', 'Steal role from player.', WerewolfPlugin.prototype.cmdStealRole, WerewolfPlugin, { minArgs: 1, maxArgs: 1 });
 
     bot.addContextCmd('wereswap', 'swap the roles of two other players.', WerewolfPlugin.prototype.cmdSwapRoles, WerewolfPlugin, { minArgs: 2, maxArgs: 2 });
 
 
     bot.addContextCmd('werevote', 'Start wolf game.',
         WerewolfPlugin.prototype.cmdJoinGame,
         WerewolfPlugin,
         { minArgs: 1, maxArgs: 1, group: 'right' });*/


}