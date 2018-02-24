const Chess = require( 'chess-rules');
const Display = require( './display.js');
const Export = require( './export.js');

const ID_SEPARATOR = '-';

module.exports = class Game {
	
	/**
	 * Id for a game still in progress. Once a game is over
	 * the timestamp is appended to the id.
	 * @param {*} user1 
	 * @param {*} user2 
	 */
	static getActiveId( user1, user2 ) {

		let id1 = user1.id;
		let id2 = user2.id;

		return ( id1 <= id2) ? ( id1 + ID_SEPARATOR + id2 ) : (id2 + ID_SEPARATOR + id1 );

	}

	get history() { return this._history; }
	set history( h ) { this._history = h; }

	get turn() { return this._turn; }
	get whiteID() { return this.w_id; }
	get blackID() { return this.b_id; }

	get status() { return this._status; }
	get gameState() { return this._gameState; }

	get lastMove() { return this._lastMove; }

	get timestamp() { return this._timestamp; }

	get tags() { return this._tags; }
	set tags( t ) { this._tags = t; }

	/**
	 * 
	 * @param {string} w White user id. 
	 * @param {string} b Black user id.
	 * @param {number} createTime Timestamp when game began.
	 * @param {object} state Current chess-rules position of game.
	 */
	constructor( w, b, createTime, state ) {

		if ( state == null ) state = Chess.getInitialPosition();

		this._timestamp = createTime;

		this._gameState = state;

		this._turn = state.turn == 'W' ? w : b;
		this.w_id = w;
		this.b_id = b;

		this._tags = {};

		this._history = [];

		this._status = Chess.getGameStatus( state );

		this._lastMove = null;

	}

	/**
	 * id for a game that will be archived.
	*/
	getArchiveId() {
		return ( this.w_id<= this.b_id) ? ( this.w_id + ID_SEPARATOR + this.b_id + ID_SEPARATOR + this._timestamp ) :
		( this.w_id + ID_SEPARATOR + this.b_id + ID_SEPARATOR + this._timestamp );
	}

	getSaveId() {

		if ( this.status === 'OPEN') return ( this.w_id<= this.b_id) ? ( this.w_id + ID_SEPARATOR + this.b_id ) :
		( this.w_id + ID_SEPARATOR + this.b_id );

		return ( this.w_id<= this.b_id) ? ( this.w_id + ID_SEPARATOR + this.b_id + ID_SEPARATOR + this._timestamp ) :
		( this.w_id + ID_SEPARATOR + this.b_id + ID_SEPARATOR + this._timestamp );

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

		if ( this._status != 'OPEN' ) return false;

		if ( uid == w_id ) {
			this._status = 'BLACKWON';
		} else if ( uid == b_id ) {
			this._status = 'WHITEWON';
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
			if ( this._status != 'OPEN') moveStr += '#';
			else moveStr += '+';

		}

		this._history.push( moveStr );

		this._gameState = newState;
		this._lastMove = oldState.turn + ' ' + moveStr;
	

		this._turn = ( newState.turn === 'W') ? this.w_id : this.b_id;

		return true;

	}

	/**
	 * Returns true if the player is playing this game.
	 * false otherwise.
	 * @param {number} uid - user id of player to check. 
	 */
	hasPlayer( uid ) {
		return ( this.w_id === uid || this.b_id === uid );
	}

	getStatusString() {

		let str = this._gameState.status;

		if ( str == 'WHITEWON') {
			return 'White has won the game.';
		} else if ( str == 'BLACKWON') {
			return 'Black has won the game.';
		} else if ( str == 'PAT') {
			return 'The game is a stalemate.';
		}
		return ( this._gameState.turn === 'W') ? 'White to move.' : 'Black to move.';

	}

	toJSON(){

		return {
			pgn:Export.toPGN(this),
			fen:Chess.positionToFen( this._state ),
			wid:this.w_id,
			bid:this.b_id,
			time:this._timestamp
		};

	}
}