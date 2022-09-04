import { BotContext, ContextSource } from '../../src/bot/botcontext';
import { Message, GuildMember, User, TextBasedChannel } from 'discord.js';
import { GameCache } from '../../src/gamecache';
import { DiscordBot } from '../../src/bot/discordbot';
import { ChessGame } from './chessgame';
import * as Export from './export';

const Display = require('./display');

const game_dir: string = 'chess/';

class Room {

	private _context: BotContext<ContextSource>;
	readonly gcache: GameCache;

	/**
	 *
	 * @param {BotContext} context
	 */
	constructor(context: BotContext<ContextSource>) {

		this._context = context;
		this.gcache = new GameCache(context, game_dir, ChessGame.FromJSON);

	}

	/**
	 * @async
	 * @param {Message} m
	 * @param {string} [p1]
	 * @param {string} [p2]
	 * @returns {Promise}
	 */
	async cmdShowGames(m: Message, p1?: string, p2?: string) {

		try {

			const user1 = p1 ? this._context.userOrSendErr(m, p1) : m.author;
			if (!user1) {
				return;
			}

			let user2 = null;
			if (p2) {
				user2 = this._context.userOrSendErr(m, p2);
				if (!user2) return;
			}

			await this.gcache.printGames(m, user1, user2);

		} catch (e) { console.error(e); }

	}

	/**
	 * @async
	 * @param {Message} m
	 * @param {string} oppName
	 * @param {string} [firstMove]
	 * @returns {Promise}
	 */
	async cmdNewGame(m: Message, oppName: string, firstMove?: string) {

		try {

			const opp = this._context.userOrSendErr(m.channel, oppName);
			if (!opp) return;

			let game = await this.gcache.getGame(m.author, opp);
			if (game && game.inProgress()) {

				return this.moveOrShowErr(m, game, firstMove);

			} else if (!firstMove) game = await this.startGame(opp, m.author);
			else {

				game = await this.startGame(m.author, opp);
				if (!game.tryMove(firstMove))
					await m.reply(firstMove + ' is not a legal move.');

			}

			Display.showBoard(m.channel, game);

		} catch (e) { console.error(e); }

	}

	/**
	 * @async
	 * @param {Message} m
	 * @param {string} opp
	 * @param {?number} [gnum=null]
	 * @returns {Promise}
	 */
	async cmdLoadGame(m: Message, opponent: string, gnum?: number) {

		const opp = this._context.userOrSendErr(m, opponent)
		if (!opp) return;

		const game = await this.gcache.getGame(m.author, opp, gnum);
		if (!game) return m.reply('Game not found.');
		else return m.reply('Game loaded.');

	}

	/**
	 * Display a PGN of a game.
	 * @async
	 * @param {Message} m
	 * @param {string} [p1]
	 * @param {string} [p2]
	 * @param {?number} [gnum]
	 * @returns {Promise}
	 */
	async cmdPGN(m: Message, p1?: string | User, p2?: string | User, gnum?: number) {

		if (!p1) p1 = m.author;
		else if (!p2) p2 = m.author;

		const game = await this.gcache.gameOrSendErr(m, p1, p2, gnum);
		if (!game) return;

		try {

			const str = Export.toPGN(game);
			return m.channel.send(str);

		} catch (e) { console.error(e); }

	}

	/**
	 * @async
	 * @param {Message} m
	 * @param {string} oppName
	 * @param {?number} [gnum]
	 * @returns {Promise}
	 */
	async cmdResign(m: Message, oppName: string, gnum?: number) {

		const game = await this.gcache.gameOrSendErr(m, m.author, oppName, gnum);
		if (!game) return;

		if (!game.tryResign()) m.channel.send('The game is already over.');

		return this.sendGameStatus(m.channel, game);

	}

	/**
	 * @async
	 * @param {Message} m
	 * @param {string} p1
	 * @param {string} p2
	 * @param {?number} [gnum]
	 * @returns {Promise}
	 */
	async cmdViewBoard(m: Message, p1?: string | User, p2?: string | User, gnum?: number) {

		if (!p1) {
			//console.log('using author as opp1');
			p1 = m.author;
		} else if (!p2) {
			//console.log('using author as opp2');
			p2 = m.author;
		}

		const game = await this.gcache.gameOrSendErr(m, p1, p2, gnum);
		if (game) return Display.showBoard(m.channel, game);

	}

	/**
	 * @async
	 * @param {Message} m
	 * @param  {...string[]} args
	 * @returns {Promise}
	 */
	async cmdDoMove(m: Message, ...args: string[]) {

		const len = args.length;
		let game, moveStr;
		if (len === 0) return m.reply('Must specify a move.');
		else if (len === 1) {

			// !move moveStr
			game = await this.gcache.gameOrSendErr(m, m.author);
			moveStr = args[0];

		} else if (len === 2) {
			// !move opponent moveStr
			game = await this.gcache.gameOrSendErr(m, m.author, args[0]);
			moveStr = args[1];
		} else return m.reply('Unexpected move input.');

		if (!game) return;

		return this.moveOrShowErr(m, game, moveStr);

	}

	/**
	 * @async
	 * @param {Message} m
	 * @param {ChessGame} game
	 * @param {string} moveStr
	 * @returns {Promise}
	 */
	async moveOrShowErr(m: Message, game: ChessGame, moveStr?: string) {

		if (!game.inProgress()) return this.sendGameStatus(m.channel, game);
		if (!moveStr) return m.channel.send(`Must supply a move.`);

		else if (game.turn === m.author.id) {

			if (game.tryMove(moveStr)) {

				this.sendGameStatus(m.channel, game);

				/// check game ended this turn.
				if (!game.inProgress()) {
					await this.gcache.completeGame(game);
				}

			} else return m.reply(moveStr + ' is not a legal move.');

		} else return m.reply('It is not your turn to move.');

	}

	/**
	 * @async
	 * @param {Channel} chan
	 * @param {Game} game
	 */
	async sendGameStatus(chan: TextBasedChannel, game: ChessGame) {
		return chan.send(game.getStatusString());
	}

	/**
	 * @async
	 * @param w_user - white user.
	 * @param b_user - black user.
	 * @returns {ChessGame}
	 */
	async startGame(w_user: User | GuildMember, b_user: User | GuildMember) {

		const game = new ChessGame(w_user.id, b_user.id, Date.now());

		await this.gcache.addNew(game);
		return game;

	}

} // class

/**
 * @async
 * @param {BotContext} bot
 */
export async function init(bot: DiscordBot) {

	console.log('Chess INIT');

	await Display.loadImages();

	bot.addContextCmd('chessgames', 'chessgames [player1] [player2]', Room.prototype.cmdShowGames, Room, { maxArgs: 2 });

	bot.addContextCmd('loadchess', 'loadchess [opp] [game num]\nLoad a game to be your currently played game.',
		Room.prototype.cmdLoadGame, Room, { maxArgs: 2 });

	bot.addContextCmd('chess', 'chess <opponentName> [firstMove]',
		Room.prototype.cmdNewGame, Room, { maxArgs: 2 });

	bot.addContextCmd('chessmove', 'chessmove [opponentName] <moveString>',
		Room.prototype.cmdDoMove, Room, { maxArgs: 2 });
	bot.addContextCmd('chessboard', 'chessboard [opponentName]',
		Room.prototype.cmdViewBoard, Room, { maxArgs: 2 });

	bot.addContextCmd('resign', 'resign [opponentName] [game number]',
		Room.prototype.cmdResign, Room, { maxArgs: 1 });

	bot.addContextCmd('pgn', 'pgn [opponentName]', Room.prototype.cmdPGN, Room, { maxArgs: 2 });

} // init()