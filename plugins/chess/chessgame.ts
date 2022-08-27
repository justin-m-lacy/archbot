import Game from '../../src/game';
import * as Export from './export';

const Chess = require('chess-rules');

export enum ChessStatus {
	Open = 'OPEN',
	BlackWon = 'BLACKWON',
	WhiteWon = 'WHITEWON',
	Draw = 'PAT'
}

//const ID_SEPARATOR = '-';
//const CHECKMATE = '#';
//const CHECK = '+';

export type ChessTags = { [tag: string]: string };

export class ChessGame extends Game {

	get history() { return this._history; }
	set history(h: string[]) {

		this._history.length = 0;
		for (let i = 0; i < h.length; i++) {
			this._history.push(h[i]);
		}
	}

	get turn() { return this._turn; }
	get whiteID() { return this.player1Id; }
	get blackID() { return this.player2Id; }

	get status() { return this._status; }
	get gameState() { return this._gameState; }

	get lastMove() { return this._lastMove; }

	get tags() { return this._tags; }
	set tags(t) { this._tags = t; }

	private _tags: ChessTags;

	/**
	 * Id of player with current turn.
	 */
	private _turn: string;
	private readonly _history: string[];
	private _status: ChessStatus;
	private _lastMove?: string | null;
	private _gameState: any;

	static FromJSON(data: any) {

		if (!data.p1) return "White player not known.";
		if (!data.p2) return "Black player not known.";

		if (!data.fen) return "Game state not found."

		//console.log( 'fen: ' + data.fen );

		let state = Chess.fenToPosition(data.fen);

		let game = new ChessGame(data.p1, data.p2, data.time, state, data.status);

		Export.readPGN(data.pgn, game);

		return game;

	}

	toJSON() {

		return {
			pgn: Export.toPGN(this),
			fen: Chess.positionToFen(this._gameState),
			status: this._status,
			... super.toJSON()
		};

	}

	/**
	 * 
	 * @param {string} w White user id. 
	 * @param {string} b Black user id.
	 * @param {number} createTime Timestamp when game began.
	 * @param {object} state Current chess-rules position of game.
	 */
	constructor(w: string, b: string, createTime: number, state?: any, status?: ChessStatus) {

		super(w, b, createTime);

		if (state == null) state = Chess.getInitialPosition();

		this._gameState = state;

		this._turn = state.turn === 'W' ? w : b;

		this._tags = {};

		this._history = [];

		this._status = status || Chess.getGameStatus(state);

		this._lastMove = null;

	}

	inProgress() {
		return this._status === ChessStatus.Open;
	}

	/**
	 * Returns a named pgn tag.
	 * @param {string} tagName 
	 */
	getTag(tagName: string) { return this._tags[tagName]; }

	/**
	 * returns the current board position.
	 * @returns {array} board positions.
	*/
	getBoard() { return this._gameState.board; }

	/**
	 * Attempts to resign the game. Returns false if the
	 * game is already over, or the user is not one of the
	 * players. Returns true otherwise.
	 * @param {string} uid - user id of player resigning. 
	 */
	tryResign(uid: string) {

		if (this._status !== ChessStatus.Open) return false;

		if (uid === this.player1Id) this._status = ChessStatus.BlackWon;
		else if (uid === this.player2Id) this._status = ChessStatus.WhiteWon;
		else return false;

		return true;

	}

	tryMove(moveStr: string) {

		let oldState = this._gameState;
		let move = Chess.pgnToMove(oldState, moveStr);
		if (move == null) return false;

		let newState = Chess.applyMove(oldState, move);
		this._status = Chess.getGameStatus(newState);

		if (newState.check) {
			// append check or mate symbols to move if necessary.
			if (this._status !== ChessStatus.Open) moveStr += '#';
			else moveStr += '+';

		}

		this._history.push(moveStr);

		this._gameState = newState;
		this._lastMove = oldState.turn + ' ' + moveStr;


		this._turn = (newState.turn === 'W') ? this.player1Id : this.player2Id;

		return true;

	}

	getStatusString(): string {

		const str: string = this._status;

		if (str === ChessStatus.WhiteWon) return 'White has won the game.';
		else if (str === ChessStatus.BlackWon) return 'Black has won the game.';
		else if (str === ChessStatus.Draw) return 'The game is a stalemate.';

		return (this._gameState.turn === 'W') ? 'White to move.' : 'Black to move.';

	}
}