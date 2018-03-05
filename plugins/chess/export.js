let Chess = require( 'chess-rules' );
let Game = require( './chessgame.js' );

exports.toPGN = toPGN;

function toPGN( game ) {

	let history = game.history;
	let len = history.length;

	let fullMoves = [];
	let curCount = 1;
	let turnStr = curCount + '.';

	for( let i = 0; i < len; i++ ) {

		var ply = history[i].trim();
		turnStr += ' ' + ply;

		if ( curCount % 2 == 0 ) {
			fullMoves.push( turnStr);
			turnStr = curCount + '.';
		}
		curCount++;

	}
	// remainder ply.
	if ( len % 2 != 0 ) fullMoves.push(turnStr);

	let status = game.status;
	if ( status == 'OPEN' ) fullMoves.push( '*');
	else if ( status == 'WHITEWON') fullMoves.push('1-0');
	else if ( status == 'BLACKWON') fullMoves.push('0-1');
	else if ( status == 'PAT') fullMoves.push('1/2-1/2');

	let pgnStr = fullMoves.join( ' ' );

	console.log( pgnStr );

	return pgnStr;

}

/**
 * Returns a string of pgn tags []
 * @param {Game} game 
 */
function getTagsStr( game ) {
}

function fromJSON( data ) {

	if ( data.wid == null ) {
		return "White player not known.";
	}
	if ( data.bid == null ) {
		return "Black player not known.";
	}
	if ( data.fen == null ) {
		return "Game state not found."
	}

	let state = Chess.fenToPosition( data.fen );

	let game = new Game( data.wid, data.bid, data.time, state );

	return game;

}

/**
 * Parses pgn history and tags and
 * sets the appropriate data in a game.
 * @param {string} pgn 
 */
function readPGN( pgn, game ) {

	// parsing tags.
	let regex = /\[(\w+)\s\"((?[\w\d\s]|\\")+)"\]/g;
	var results;
	var len;

	let tags = {};

	while ((results = regex.exec(pgn)) !== null ) {

		if ( results.length == 3 ) {
			tags[ results[1] ] = results[2];
		} else if ( results.length == 2 ) {
			// should never happen.
			tags[results[1]] = '';
		}

	}

	game.tags = tags;

	// parsing moves.

	regex = /\d+\.\s(\w+)\s(\w+)/g;
	let history = [];
	while ( (results = regex.exec(pgn)) !== null ) {

		if ( results.length == 2 ) history.push( results[1]);
		else if ( results.length == 3 ){
			history.push( results[1]);
			history.push( results[2]);
		}
	}

	game.history = history;

}