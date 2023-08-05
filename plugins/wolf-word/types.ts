export class GameStartedError extends Error {
    constructor(){
        super();
        this.name="GameStartedError";
    }
}

export class GameNotFoundError extends Error {
    constructor(){
        super();
        this.name='GameNotFoundError';
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