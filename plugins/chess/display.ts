import { TextChannel } from 'discord.js';
import ChessGame from './chessgame';
import jimp from 'jimp';
import Discord from 'discord.js';

//const Discord = require('discord.js');

/**
 * {Jimp}
 */
var imgBoard: jimp | null;
var imgPieces: jimp | null;
var tSize: number;
var imagesLoaded: boolean = false;

// tiled piece positions.
//const teamRow = { 'W':1, 'B':0 };

const pieceCol = { 'Q': 0, 'K': 1, 'R': 2, 'N': 3, 'B': 4, 'P': 5 };

/**
 * Maps chess letters to unicode characters.
 * Black pieces are lowercase.
 */
const to_unicode = {
	'K': '\u2654', 'Q': '\u2655', 'R': '\u2656',
	'B': '\u2657', 'N': '\u2658', 'P': '\u2659',
	'k': '\u265A', 'q': '\u265B', 'r': '\u265C',
	'b': '\u265D', 'n': '\u265E', 'p': '\u265F'
};

/**
* @async
* @returns {Promise}
*/
export const loadImages = async () => {

	try {

		imgBoard = await jimp.read(__dirname + '/images/board.png');
		imgPieces = await jimp.read(__dirname + '/images/pieces.png');

		tSize = Math.floor(imgBoard.bitmap.width / 8);

		imagesLoaded = true;

	} catch (e) {
		console.error(e);
	}

}

/**
 * @async
 * @param {Channel} chan
 * @param {ChessGame} game
 * @returns {Promise}
 */
export const showBoard = async (chan: TextChannel, game: ChessGame) => {

	if (imagesLoaded) {

		try {

			let buff = await getBoardImg(game);
			if (buff) {

				//let attach =
				return chan.send(game.getStatusString(), new Discord.MessageAttachment(buff));

			}

		} catch (e) {
			console.error(e);
		}

	}

	return chan.send(getBoardStr(game));

}

/**
 * @asyn
 * @param {Game} game
 * @returns {Promise<Buffer>}
 */
const getBoardImg = async (game: ChessGame) => {

	let img = imgBoard!.clone();
	let pieces = imgPieces;

	let b = game.getBoard();

	let srcR, srcC;
	let i = 0, destRow = 7, destCol = 0;

	while (i < 64) {

		const sqr = b[i];
		if (sqr != null) {

			srcR = sqr.side == 'W' ? 1 : 0;
			srcC = pieceCol[sqr.type];

			img.blit(pieces, destCol * tSize, destRow * tSize, srcC * tSize, srcR * tSize, tSize, tSize);

		}
		destCol++; i++;
		if (destCol === 8) {
			destCol = 0;
			destRow--;
		}

	} // while

	return imageBuffer(img);

}

/**
 * Wraps image.getBuffer() in a promise to make awaitable.
 * @param {Jimp} img
 * @returns {Promise<Buffer|null>}
 */
async function imageBuffer(img: jimp) {

	return new Promise((res) => {
		img.getBuffer(jimp.MIME_PNG, (err?: any, buff?: Buffer) => {

			res(err ? null : buff);
		});
	});

}

/**
 *
 * @param {Game} game
 * @returns {string}
 */
function getBoardStr(game: ChessGame) {

	const b = game.getBoard();
	const rows = [];

	let row = [];
	let wasPiece = false;

	let i = 0;
	while (i < 64) {

		const sqr = b[i];
		if (sqr == null) {
			if (wasPiece) row.push('. ')
			else row.push('. ');
			wasPiece = false;
		} else {
			if (sqr.side == 'B') row.push(to_unicode[sqr.type.toLowerCase()]);
			else row.push(to_unicode[sqr.type]);
			wasPiece = true;
		}


		if (++i % 8 === 0) {

			rows.unshift(row.join(' '));
			row = [];
			wasPiece = false;
		}

	} //

	let res = '```';
	if (game.lastMove != null) res += ' ' + game.lastMove;

	return res + '\n' + rows.join('\n') + '\n' + game.getStatusString() + '```';

}