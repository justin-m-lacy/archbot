const ChessGame = require( './chessgame.js');
const Display = require( './display.js' );
const Export = require( './export.js' );

const GameCache = require( '../../gamecache.js');

const game_dir = 'chess/';

class Room {

	/**
	 * 
	 * @param {BotContext} context 
	 */
	constructor( context ) {

		this._context = context;
		this.gcache = new GameCache( context, game_dir, ChessGame.FromJSON );

	}

	/**
	 * @async
	 * @param {Message} m 
	 * @param {string} [p1] 
	 * @param {string} [p2]
	 * @returns {Promise}
	 */
	async cmdShowGames( m, p1, p2 ) {

		try {

			if ( !p1 ) p1 = m.author;
			else {
				p1 = this._context.userOrSendErr( m, p1 );
				if ( !p1 ) return;
			}

			if ( p2 ) {
				p2 = this._context.userOrSendErr( m, p2 );
				if ( !p2 ) return;
			}

			await this.gcache.printGames( m, p1, p2 );

		} catch ( e ) { console.error(e);}

	}

	/**
	 * @async
	 * @param {Message} m 
	 * @param {string} oppName 
	 * @param {string} [firstMove] 
	 * @returns {Promise}
	 */
	async cmdNewGame( m, oppName, firstMove ) {

		try {

			let opp = this._context.userOrSendErr( m.channel, oppName );
			if ( !opp ) return;

			let game = await this.gcache.getGame( m.author, opp );
			if ( game && game.isOpen() ) {

				console.log( 'playing existing game.');
				return this.moveOrShowErr( m, game, firstMove );

			}

			if ( !firstMove  ) game = await this.startGame( opp, m.author );
			else {

				game = await this.startGame( m.author, opp );
				if ( !game.tryMove( firstMove) )
					await m.reply( firstMove + ' is not a legal move.');

			}

			Display.showBoard( m.channel, game );

		} catch( e) { console.error(e);}

	}

	/**
	 * @async
	 * @param {Message} m 
	 * @param {string} opp 
	 * @param {?number} [gnum=null]
	 * @returns {Promise}
	 */
	async cmdLoadGame( m, opp, gnum=null ) {

		opp = this._context.userOrSendErr( m, opp )
		if ( !opp ) return;

		let game = await this.gcache.getGame( m.author.id, opp.id, gnum );
		if ( !game ) return m.reply( 'Game not found.');
		else return m.reply( 'Game loaded.');

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
	async cmdPGN( m, p1, p2, gnum ) {

		if ( !p1 ) p1 = m.author;
		else if ( !p2 ) p2 = m.author;

		let game = await this.gcache.gameOrSendErr( m, p1, p2, gnum );
		if ( !game ) return;

		try {

			let str = Export.toPGN( game );
			return m.channel.send( str );

		} catch ( e) { console.error(e); }

	}

	/**
	 * @async
	 * @param {Message} m 
	 * @param {string} oppName 
	 * @param {?number} [gnum]
	 * @returns {Promise}
	 */
	async cmdResign( m, oppName, gnum ) {

		let game = await this.gcache.gameOrSendErr( m, m.author, oppName, gnum);
		if ( !game ) return;

		if ( !game.tryResign() ) m.channel.send( 'The game is already over.');

		return this.sendGameStatus( m.channel, game );

	}

	/**
	 * @async
	 * @param {Message} m 
	 * @param {string} p1 
	 * @param {string} p2 
	 * @param {?number} [gnum]
	 * @returns {Promise}
	 */
	async cmdViewBoard( m, p1, p2, gnum ) {

		if ( !p1 ) {
			//console.log('using author as opp1');
			p1 = m.author;
		} else if ( !p2 ) {
			//console.log('using author as opp2');
			p2 = m.author;
		}

		let game = await this.gcache.gameOrSendErr( m, p1, p2, gnum );
		if ( game ) return Display.showBoard( m.channel, game );

	}

	/**
	 * @async
	 * @param {Message} m 
	 * @param  {...string[]} args
	 * @returns {Promise}
	 */
	async cmdDoMove( m, ...args ) {

		let len = args.length;
		let game, moveStr;
		if ( len === 0 ) return m.reply( 'Must specify a move.');
		else if ( len === 1 ) {

			// !move moveStr
			game = await this.gcache.gameOrSendErr( m, m.author, null );
			moveStr = args[0];

		} else if ( len === 2 ) {
			// !move opponent moveStr
			game = await this.gcache.gameOrSendErr( m, m.author, args[0]);
			moveStr = args[1];
		} else return m.reply( 'Unexpected move input.' );

		if ( !game ) return;

		return this.moveOrShowErr( m, game, moveStr );
		
	}

	/**
	 * @async
	 * @param {Message} m 
	 * @param {ChessGame} game 
	 * @param {string} moveStr
	 * @returns {Promise}
	 */
	async moveOrShowErr( m, game, moveStr ) {

		if ( !game.isOpen() ) return this.sendGameStatus( m.channel, game );

		else if ( game.turn === m.author.id ){

			if ( game.tryMove( moveStr ) ) {

				this.sendGameStatus( m.channel, game );

				/// check game ended this turn.
				if ( !game.isOpen() ) {
					await this.gcache.completeGame( game );
				}

			} else m.reply( moveStr + ' is not a legal move.');

		} else return m.reply( 'It is not your turn to move.' );

	}

	/**
	 * @async
	 * @param {Channel} chan 
	 * @param {Game} game 
	 */
	async sendGameStatus( chan, game ) {
		return chan.send( game.getStatusString() );
	}

	/**
	 * @async
	 * @param {string} w_user - user id.
	 * @param {string} b_user - user id.
	 * @returns {ChessGame}
	 */
	async startGame( w_user, b_user ) {

		let game = new ChessGame( w_user.id, b_user.id, Date.now() );

		await this.gcache.addNew( game );
		return game;

	}

} // class

/**
 * @async
 * @param {BotContext} bot
 */
exports.init = async function( bot ) {

	console.log( 'Chess INIT' );

	await Display.loadImages();

	bot.addContextCmd( 'chessgames', '!chessgames [player1] [player2]', Room.prototype.cmdShowGames, Room, {maxArgs:2} );

	bot.addContextCmd( 'loadchess', '!loadchess [opp] [game num]\nLoad a game to be your currently played game.',
		Room.prototype.cmdLoadGame, Room, {maxArgs:2} );

	bot.addContextCmd( 'chess', '!chess <opponentName> [firstMove]',
		Room.prototype.cmdNewGame, Room, {maxArgs:2} );

	bot.addContextCmd( 'chessmove', '!chessmove [opponentName] <moveString>',
		Room.prototype.cmdDoMove, Room, {maxArgs:2} );
	bot.addContextCmd( 'chessboard', '!chessboard [opponentName]',
		Room.prototype.cmdViewBoard, Room, {maxArgs:2} );

	bot.addContextCmd( 'resign', '!resign [opponentName] [game number]',
		Room.prototype.cmdResign, Room, { maxArgs:1} );

	bot.addContextCmd( 'pgn', '!pgn [opponentName]', Room.prototype.cmdPGN, Room, {maxArgs:2} );

} // init()