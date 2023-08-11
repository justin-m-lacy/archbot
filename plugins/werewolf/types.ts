
export enum PlayerRole {

    Villager,
    Wolf,
    Seer,
    Thief,
    Troubler,
    Minion

}

export enum DayPhase {

    Werewolves=1,
    Minion=2,
    Seer=3,
    Thief=4,
    Troubler=5
}

export enum GamePhase {

    Joining,
    Active,
    Voting,
    Ended

}


export enum PlayerState {
    Alive=1,
    Dead=0
}

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
 * Target of a command is not in game.
 */
export class UserNotInGameError extends Error {
    constructor(){
        super();
        this.name='UserNotInGameError';
    }
}

export class AlreadyInGameError extends Error {
    constructor(){
        super();
        this.name='AlreadyInGameError'
    }
}