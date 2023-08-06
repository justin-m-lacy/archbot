
import { groups } from "./word-groups.json";
import { randElm } from '@src/utils/jsutils';
import { GamePhaseError, IWolfPlugin, NotEnoughPlayersError, PickWordsError, UserNotInGameError } from './types';

export enum GamePhase {

    Joining,
    Active,
    Voting,
    MinorityVote,
    Ended

}

const MIN_PLAYERS = 3;

const NO_VOTE = "NO_VOTE";
const NO_WORD = "NO_WORD";

type Player = string|typeof NO_VOTE;
type Word =  string|typeof NO_WORD;


export class WolfWordGame {

    /**
     * Minority was voted off by other players.
     */
    private _wolfFound = false;
    public get wolfFound() {return this._wolfFound}

    
    private _gamePhase:GamePhase = GamePhase.Joining;

    private readonly plugin:IWolfPlugin;
    readonly channelId:string;

    /// Map player to word given to player.
    private readonly players:Map<Player,Word> = new Map();

    /// tally of votes against each player.
    private readonly votes:Map<Player,number> = new Map();

    private voteCount:number = 0;

    public get wolfPlayer(){return this._wolfPlayer}
    private _wolfPlayer:string = '';

    private wolfWord:string = NO_WORD;
    private majorityWord:string = NO_WORD;

    /**
     * Players voted as minority.
     */
    private wolfVotes:Player[]|null = null;

    constructor( plugin:IWolfPlugin, channelId:string){

        this.plugin = plugin;
        this.channelId = channelId;
    
        if ( !groups.some(v=>v.length>=2)) {
            throw new PickWordsError();
        }

    }

    votingDone(){return this._gamePhase === GamePhase.MinorityVote||this._gamePhase === GamePhase.Ended}
    
    tryStart(){

        if ( this._gamePhase === GamePhase.Active||this._gamePhase === GamePhase.Voting||this._gamePhase===GamePhase.MinorityVote) {

            throw new GamePhaseError();
        } else if ( this.players.size < MIN_PLAYERS){
            throw new NotEnoughPlayersError();
        }

        this.pickWords();
        this.assignWords();

        this.reportWords();

        this._gamePhase=GamePhase.Active;


    }

    join( player:string ){

        if ( this._gamePhase !== GamePhase.Joining && this._gamePhase !== GamePhase.Ended){
            throw new GamePhaseError();
        }
        this.players.set(player, NO_WORD);

    }

    /**
     * Player casts vote for minority word.
     * @param player 
     * @param votedPlayerId 
     */
    vote(player:string, votedPlayerId:string ){

        const curVote = this.players.get(player);

        /// must vote for player in game.
        if ( !this.players.has(votedPlayerId)){

            throw new UserNotInGameError();

        } else if ( this._gamePhase !== GamePhase.Voting ) {

            throw new GamePhaseError();

        } else if ( curVote === NO_VOTE ) {
    
            /// Note: don't allow voting 'NO_VOTE' to add vote counts.

            this.players.set(player, votedPlayerId);
            this.voteCount++;


        }
        if ( this._gamePhase === GamePhase.Voting && this.voteCount >= this.players.size ) {
            this._gamePhase = GamePhase.MinorityVote;
            this.tallyVotes();
        }

    }

    /**
     * Pick the majority words and wolf word for this game.
     * Words are not yet assigned.
     */
    private pickWords(){

        const group = randElm( groups );

        if ( group.length <= 2 ) {
            console.log(`invalid group length.`);
            this.pickWords();
            return;
        }

        const len = group.length;

        const ind1 = Math.floor(len*Math.random() );
        const ind2 = (1 + Math.floor((len-1)*Math.random())) % len;

        this.wolfWord = group[ind1];
        this.majorityWord = group[ind2];

    }

    /**
     * DM each player their secret word.
     */
    private async reportWords(){

        return Array.from(this.players.entries()).map(kvp=>{
            this.plugin.getUser(kvp[0]).then(v=>v?.send(`Your word is: ${kvp[1]}`))
        });

    }

    /**
     * Assign words to players.
     */
    private assignWords(){

        const ind = Math.floor( Math.random()*this.players.size );

        /// Word assignment not necessary.
        /// Useful if more than one minority player or multiple minority words.
        let i = 0;
        for( const player of this.players.keys()){

            if( i === ind ) {
                this._wolfPlayer = player;
                this.players.set(player, this.wolfWord);
            } else {
                this.players.set(player, this.majorityWord);
            }
            i++;

        }

    }

    private tallyVotes(){

        this._wolfFound =false;
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
                if ( entries[0]=== this._wolfPlayer) {
                    this._wolfFound=true;
                }
                topVoted.push(entries[0]);
            }
        }

        this.wolfVotes = topVoted;

    }

    /**
     * Reset game with same players.
     */
    reset(){
        this._gamePhase = GamePhase.Joining;
        this.voteCount = 0;
        this.wolfVotes = null;
        this._wolfFound=false;
        this.votes.clear();
    }

}
