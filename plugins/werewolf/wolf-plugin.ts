import { DiscordBot } from "@src/bot/discordbot";
import { Message } from 'discord.js';
import { randElm } from '@src/utils/jsutils';

const NO_PLAYER = "NO_PLAYER";
const NO_VOTE = "NO_VOTE";

enum GamePhase {

    Joining,
    Active,
    Voting,
    Ended

}

enum Alive {
    True=1,
    False=0
}

type Player = string|typeof NO_PLAYER;
type Vote = string|typeof NO_VOTE;

class WerewolfGame {


    private gamePhase:GamePhase = GamePhase.Joining;

    private readonly wolves:Player[] = [];
    private readonly villages:Player[] = [];
    private readonly knight:Player = NO_PLAYER;

    /// Map player to word given to player.
    private readonly players:Map<Player,Alive> = new Map();

    /// Vote for each round.
    private readonly votes:Map<Player,Vote> = new Map();

    private voteCount:number = 0;


    constructor(){
    }

    join( player:string ){

        this.players.set(player, Alive.True);


    }

    /**
     * Assign words, begin game.
     */
    startGame(){



    }

    /**
     * Player casts vote for minority word.
     * @param player 
     * @param vote 
     */
    vote(player:string, vote:string ){

        const curVote = this.votes.get(player);

        /// must vote for player in game.
        if ( !this.players.has(vote)){

            return false;

        } else if ( curVote !== undefined && curVote === NO_VOTE ) {

            this.votes.set(player, vote);
            this.voteCount++;


        }
        if ( this.gamePhase === GamePhase.Voting && this.voteCount >= this.players.size ) {
            this.tallyVotes();
        }

    
    }

    tallyVotes(){
    }

}

class WordWolfPlugin {

    private gamesByChannel:Map<string,WerewolfGame> = new Map();

    cmdWolf( m :Message ){
    }

    cmdVote( m:Message, who:string ){
    }
}

export const init = (bot:DiscordBot)=>{

    /*bot.addContextCmd('wolf', 'Start wolf game.', WordWolfPlugin.prototype.cmdWolf, WordWolfPlugin,
    { maxArgs:0, });

    bot.addContextCmd('wolfvote', 'Start wolf game.',
        WordWolfPlugin.prototype.cmdWolf,
        WordWolfPlugin,
        { minArgs: 1, maxArgs: 1, group: 'right' });*/


}