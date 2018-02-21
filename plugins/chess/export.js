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

function toJSON( game ) {

	let obj = {

		pgn:toPGN(game),
		state:Chess.positionToFen( game.state ),
		wid:game.whiteID,
		bid:game.blackID

	}

	return JSON.stringify( obj );

}