const Chess = require( 'chess-rules');
const Display = require( './display.js');
const Export = require( './export.js');
const Game = require( '../../game.js');

const ID_SEPARATOR = '-';

const OPEN = 'OPEN';
const BLACKWON = 'BLACKWON';
const WHITEWON = 'WHITEWON';
const DRAW = 'PAT';
const CHECKMATE = '#';
const CHECK = '+';

module.exports = class ChessGame extends Game {

	get history() { return this._history; }
	set history( h ) { this._history = h; }

	get turn() { return this._turn; }
	get whiteID() { return this.p1; }
	get blackID() { return this.p2; }

	get status() { return this._status; }
	get gameState() { return this._gameState; }

	get lastMove() { return this._lastMove; }

	get tags() { return this._tags; }
	set tags( t ) { this._tags = t; }

	static FromJSON( data ) {

		if ( data.p1 == null ) {
			return "White player not known.";
		}
		if ( data.p2 == null ) {
			return "Black player not known.";
		}
		if ( data.fen == null ) {
			return "Game state not found."
		}
		
		console.log( 'fen: ' + data.fen );

		let state = Chess.fenToPosition( data.fen );
	
		let game = new ChessGame( data.p1, data.p2, data.time, state );

		Export.readPGN( data.pgn, game );

		return game;
	
	}

	/**
	 * 
	 * @param {string} w White user id. 
	 * @param {string} b Black user id.
	 * @param {number} createTime Timestamp when game began.
	 * @param {object} state Current chess-rules position of game.
	 */
	constructor( w, b, createTime, state ) {

		super( w, b, createTime );

		if ( state == null ) state = Chess.getInitialPosition();

		this._gameState = state;

		this._turn = state.turn === 'W' ? w : b;

		this._tags = {};

		this._history = [];

		this._status = Chess.getGameStatus( state );

		this._lastMove = null;

	}

	isOpen() {
		return this._status === OPEN;
	}

	/**
	 * Returns a named pgn tag.
	 * @param {string} tagName 
	 */
	getTag( tagName ) { return this._tags[tagName]; }

	/**
	 * returns the current board position.
	 * @returns {array} board positions.
	*/
	getBoard() { return this._gameState.board; }

	/**
	 * Attempts to resign the game. Returns false if the
	 * game is already over, or the user is not one of the
	 * players. Returns true otherwise.
	 * @param {number} uid - user id of player resigning. 
	 */
	tryResign( uid ) {

		if ( this._status != OPEN ) return false;

		if ( uid === this.p1 ) {
			this._status = BLACKWON;
		} else if ( uid === this.p2 ) {
			this._status = WHITEWON;
		} else return false;

		return true;

	}

	tryMove( moveStr ) {

		let oldState = this._gameState;
		let move = Chess.pgnToMove( oldState, moveStr );
		if ( move == null ) return false;

		let newState = Chess.applyMove( oldState, move );
		this._status = Chess.getGameStatus( newState );

		if ( newState.check ) {
			// append check or mate symbols to move if necessary.
			if ( this._status != OPEN ) moveStr += '#';
			else moveStr += '+';

		}

		this._history.push( moveStr );

		this._gameState = newState;
		this._lastMove = oldState.turn + ' ' + moveStr;
	

		this._turn = ( newState.turn === 'W') ? this.p1 : this.p2;

		return true;

	}

	getStatusString() {

		let str = this._status;

		if ( str === WHITEWON) {
			return 'White has won the game.';
		} else if ( str === BLACKWON) {
			return 'Black has won the game.';
		} else if ( str === DRAW) {
			return 'The game is a stalemate.';
		}
		return ( this._gameState.turn === 'W') ? 'White to move.' : 'Black to move.';

	}

	toJSON(){

		let json = super.toJSON();
		json.pgn = Export.toPGN(this);
		json.fen = Chess.positionToFen( this._gameState );

		return json;

	}
}