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


/**
 * Target of a command is not in game.
 */
export class UserNotInGameError extends Error {
    constructor(){
        super();
        this.name='UserNotInGameError';
    }
}
/**
 * User has not joined the game they are attempting
 * to interact with.
 */
export class GameNotJoinedError extends Error {
    constructor(){
        super();
        this.name='GameNotJoinedError';
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

export class AlreadyInGameError extends Error {
    constructor(){
        super();
        this.name='AlreadyInGameError'
    }
}


export interface IWolfPlugin {
    getUser(id:string):Promise<User|null>;
}