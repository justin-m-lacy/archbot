import { User } from 'discord.js';
export class GamePhaseError extends Error {
    constructor(){
        super();
        this.name="GamePhaseError";
    }
}

export class NotEnoughPlayersError extends Error{

    constructor(){
        super();
        this.name='NotEnoughPlayersError'
    }
}

export class GameNotFoundError extends Error {
    constructor(){
        super();
        this.name='GameNotFoundError';
    }
}

export class UserNotInGameError extends Error {
    constructor(){
        super();
        this.name='UserNotInGameError';
    }
}

/**
 * Unable to pick two words.
 */
export class PickWordsError extends Error {

    constructor(){
        super();
        this.name = 'PickWordsError';
    }
}

export interface IWolfPlugin {
    getUser(id:string):Promise<User|null>;
}