import { ChessGame, ChessStatus } from './chessgame';
import { ChessTags } from './chessgame';

export const toPGN = (game: ChessGame) => {

	const history = game.history;
	const len = history.length;

	const fullMoves: string[] = [];
	let curCount = 1;
	let turnStr = curCount + '.';

	for (let i = 0; i < len; i++) {

		var ply = history[i].trim();
		turnStr += ' ' + ply;

		if (curCount % 2 == 0) {
			fullMoves.push(turnStr);
			turnStr = curCount + '.';
		}
		curCount++;

	}
	// remainder ply.
	if (len % 2 != 0) fullMoves.push(turnStr);

	let status = game.status;
	if (status === ChessStatus.Open) fullMoves.push('*');
	else if (status === ChessStatus.WhiteWon) fullMoves.push('1-0');
	else if (status === ChessStatus.BlackWon) fullMoves.push('0-1');
	else if (status === ChessStatus.Draw) fullMoves.push('1/2-1/2');

	let pgnStr = fullMoves.join(' ');

	return pgnStr;

}

/**
 * Parses pgn history and tags and
 * sets the appropriate data in a game.
 * @param pgn 
 */
export const readPGN = (pgn: string | null, game: ChessGame) => {

	if (!pgn) return;

	// parsing tags.
	const tagRegEx = /\[(\w+)\s\"([\w\d\s\\\/,\.\-]+)\"\]/g;
	let results;

	let tags: ChessTags = {};

	while ((results = tagRegEx.exec(pgn)) !== null) {

		if (results.length == 3) {
			tags[results[1]] = results[2];
			console.log('tag found: ' + results[0]);
		} else if (results.length == 2) {
			// should never happen.
			tags[results[1]] = '';
		}

	}

	game.tags = tags;

	// parsing moves.

	const moveRegEx = /\d+\.\s(\w+)\s(\w+)/g;
	const history = [];
	while ((results = moveRegEx.exec(pgn)) !== null) {

		if (results.length == 2) history.push(results[1]);
		else if (results.length == 3) {
			history.push(results[1]);
			history.push(results[2]);
		}
	}

	game.history = history;

}