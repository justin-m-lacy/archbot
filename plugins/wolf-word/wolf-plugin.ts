import { DiscordBot } from "@src/bot/discordbot";
import { Message } from 'discord.js';
import { groups } from "./word-groups.json";
import { randElm } from '@src/utils/jsutils';
import { GameStartedError, PickWordsError } from "./types";
import { BotContext } from '@src/bot/botcontext';
import { GuildChannel } from "discord.js";

const NO_VOTE = "NO_VOTE";
const NO_WORD = "NO_WORD";

enum GamePhase {

    Joining,
    Active,
    Voting,
    MinorityVote,
    Ended

}

type Player = string|typeof NO_VOTE;
type Vote = string;
type Word =  string|typeof NO_WORD;

class WolfWordGame {

    private _gamePhase:GamePhase = GamePhase.Joining;
    public get gamePhase(){ return this._gamePhase}

    /**
     * Minority was voted off by other players.
     */
    private _wolfFound = false;
    public get wolfFound() {return this._wolfFound}

    private readonly plugin:WordWolfPlugin;
    readonly channelId:string;


    /// Map player to word given to player.
    private readonly players:Map<Player,Word> = new Map();

    /// tally of votes against each player.
    private readonly votes:Map<Player,number> = new Map();

    private voteCount:number = 0;

    private wolfPlayer:string = NO_VOTE;

    private wolfWod:string = NO_WORD;
    private majorityWord:string = NO_WORD;

    /**
     * Players voted as minority.
     */
    private wolfVotes:Player[]|null = null;

    constructor( plugin:WordWolfPlugin, channelId:string){

        this.plugin = plugin;
        this.channelId = channelId;
    
        if ( !groups.some(v=>v.length>=2)) {
            throw new PickWordsError();
        }

        this.pickWords();

    }

    canVote(){return this._gamePhase === GamePhase.Active||this._gamePhase===GamePhase.Voting}

    join( player:string ){

        this.players.set(player, NO_VOTE);


    }

    pickWords(){

        const group = randElm( groups );

        if ( group.length <= 2 ) {
            console.log(`invalid group length.`);
            this.pickWords();
            return;
        }

        const len = group.length;

        const ind1 = Math.floor(len*Math.random() );
        const ind2 = (1 + Math.floor((len-1)*Math.random())) % len;

        this.wolfWod = group[ind1];
        this.majorityWord = group[ind2];

    }

    /**
     * Assign words, begin game.
     */
    startGame(){

        const ind = Math.floor( Math.random()*this.players.size );

        /// Word assignment not necessary.
        /// Useful if more than one minority player or multiple minority words.
        let i = 0;
        for( const player of this.players.keys()){

            if( i === ind ) {
                this.wolfPlayer = player;
                this.players.set(player, this.wolfWod);
            } else {
                this.players.set(player, this.majorityWord);
            }

        }

        this._gamePhase = GamePhase.Active;

    }

    /**
     * Player casts vote for minority word.
     * @param player 
     * @param vote 
     */
    vote(player:string, vote:string ){

        const curVote = this.players.get(player);

        /// must vote for player in game.
        if ( !this.players.has(vote)){

            return false;

        } else if ( curVote !== undefined && curVote === NO_VOTE ) {

            this.players.set(player, vote);
            this.voteCount++;


        }
        if ( this._gamePhase === GamePhase.Voting && this.voteCount >= this.players.size ) {
            this.tallyVotes();
        }

    
    }

    tallyVotes(){

        let maxVoteCount = 0;

        for( const voted of this.players.values() ){

            const count = ( this.votes.get(voted) ?? 0)+1;
            this.votes.set(voted, count);

            if ( count > maxVoteCount){
                maxVoteCount = count;
            }

        }

        /// Find all players equal to max vote count.
        let topVoted:Player[] = [];
        for( const entries of this.votes ) {
            if ( entries[1] === maxVoteCount){
                topVoted.push(entries[0]);
            }
        }

        this.wolfVotes = topVoted;

    }


}

class WordWolfPlugin {

    private gamesByChannel:Map<string,WolfWordGame> = new Map();

    private context:BotContext;

    constructor( context:BotContext){
        this.context = context;
    }

    gameEnded( game:WolfWordGame){

        this.gamesByChannel.delete(game.channelId);

    }

    async reportResult( game:WolfWordGame){

        const channel = this.context.findChannel(game.channelId);
        if ( channel && channel.isTextBased()){

            if ( game.wolfFound){
                channel.send("The wolf has been found. Wolf will lose unless they guess the majority word.");
            } else {
                channel.send("The wolf was not found. The wolf wins the game.");
            }

        }


    }

    async cmdJoin( m :Message ){
        
        const game = this.joinOrCreateGame(m);
        if ( game ){
            game.join(m.author.id);
        }


    }

    async cmdVote( m:Message, who:string ){

        const game = this.getGame(m);

        if ( game ){

            if ( !game.canVote()){


            } else {

            }

        }


    }

    getGame(m:Message){

        const game = this.gamesByChannel.get(m.channelId);
        if ( !game ) m.reply("Game not found.");
        return game;
    }

    joinOrCreateGame(m:Message, ){

        try {

            const id = m.id;
            let curGame = this.gamesByChannel.get(id);
            if ( curGame && curGame.gamePhase !== GamePhase.Joining){

                m.reply("Game already in progress.");
                return null;

            } else if ( !curGame){
                curGame = new WolfWordGame( this, id );
                this.gamesByChannel.set(id, curGame);
            }

            return curGame;

        } catch ( err){

            if ( err instanceof PickWordsError) {

                m.reply("Insufficient game data.")
            } else {
                m.reply("Unable to join game.");
            }
        }

    }

}

export const init = (bot:DiscordBot)=>{

    bot.addContextCmd('wolf', 'Start wolf game.', WordWolfPlugin.prototype.cmdJoin, WordWolfPlugin,
    { maxArgs:0, });

    bot.addContextCmd('wolfvote', 'Start wolf game.',
        WordWolfPlugin.prototype.cmdJoin,
        WordWolfPlugin,
        { minArgs: 1, maxArgs: 1, group: 'right' });


}