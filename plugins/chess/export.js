let Chess = require( 'chess-rules' );
let Game = require( './game.js' );

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
	}
	if ( data.bid == null ) {
	}
	if ( data.state == null ) {
	}

	let state = Chess.fenToPosition( data.fen );

	let game = new Game( data.wid, data.bid, state );

	return game;

}

function toJSON( game ) {

	let obj = {

		pgn:toPGN(game),
		fen:Chess.positionToFen( game.state ),
		wid:game.whiteID,
		bid:game.blackID

	}

	return JSON.stringify( obj );

}

/**
 * Parses pgn history and returns an array
 * of the game moves played.
 * @param {string} pgn 
 */
function readPGNHistory( pgn ) {

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

}