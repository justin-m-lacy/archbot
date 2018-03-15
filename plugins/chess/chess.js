const Chess = require( 'chess-rules');
const Discord = require( 'discord.js');
const ChessGame = require( './chessgame.js');
const Display = require( './display.js' );
const Export = require( './export.js' );

const GameCache = require( '../../gamecache.js');

const game_dir = 'chess/';

class Room {

	constructor( context ) {

		try {
		this._context = context;
		this.activeGames = {};

		this.gcache = new GameCache( context, game_dir, ChessGame.FromJSON );

		} catch ( e) { console.log(e);}

	}

	async cmdShowGames( m, p1, p2 ) {

		try {

			if ( p1 == null ) p1 = m.author;
			else {
				p1 = this._context.userOrShowErr( m, p1 );
				if ( p1 == null) return;
			}

			if ( p2 != null ) {
				p2 = this._context.userOrShowErr( m, p2 );
				if ( p2 == null ) return;
			}

			await this.gcache.printGames( m, p1, p2 );

		} catch ( e ) { console.log(e);}

	}

	async cmdNewGame( m, oppName, firstMove=null ) {

		try {

			let opp = this._context.userOrShowErr( m.channel, oppName );
			if ( !opp ) return;

			let game = await this.gcache.getGame( m.author, opp );
			if ( game && game.isOpen() ) {

				console.log( 'playing existing game.');
				return await this.moveOrShowErr( m, game, firstMove );
			}

			if ( firstMove == null ) game = await this.startGame( opp, m.author );
			else {

				game = await this.startGame( m.author, opp );
				if ( !game.tryMove( firstMove) ) {
					m.reply( firstMove + ' is not a legal move.');
				}

			}

			Display.showBoard( m.channel, game );

		} catch( e) { console.log(e);}

	}

	async cmdLoadGame( m, opp, gnum ) {

		opp = this._context.userOrShowErr( m, opp )
		if ( opp == null) return;

		let game = this.gcache.getGame( m.author.id, opp.id, gnum );
		if ( game == null ) {
			m.reply( 'Game not found.');
		} else {
			m.reply( 'Game loaded.');
		}


	}

	async cmdPGN( m, opp1, opp2, gnum ) {

		if ( opp1 == null ) opp1 = m.author;
		else if ( opp2 == null ) opp2 = m.author;

		let game = await this.gcache.gameOrShowErr( m, opp1, opp2, gnum );
		if ( game == null ) return;

		try {

			let str = Export.toPGN( game );
			m.channel.send( str );

		} catch ( e) { console.log(e); }

	}

	async cmdResign( m, oppName, gnum ) {

		let game = await this.gcache.gameOrShowErr( m, m.author, oppName, gnum);
		if ( game == null ) return;

		if ( !game.tryResign() ) {
			m.channel.send( 'The game is already over.');
		}

		this.showGameStatus( m.channel, game );

	}

	async cmdViewBoard( m, opp1, opp2, gnum ) {

		if ( !opp1 ) {
			//console.log('using author as opp1');
			opp1 = m.author;
		} else if ( !opp2 ) {
			//console.log('using author as opp2');
			opp2 = m.author;
		}

		let game = await this.gcache.gameOrShowErr( m, opp1, opp2 );
		if ( game ) {
			Display.showBoard( m.channel, game );
		} else console.log('GAME IS NULL');

	}

	async cmdDoMove( m, ...args ) {

		let len = args.length;
		let game, moveStr;
		if ( len == 0 ) {

			m.reply( 'Must specify a move.');
			return;

		} else if ( len === 1 ) {

			// !move moveStr
			game = await this.gcache.gameOrShowErr( m, m.author, null );
			moveStr = args[0];

		} else if ( len === 2 ) {
			// !move opponent moveStr
			game = await this.gcache.gameOrShowErr( m, m.author, args[0]);
			moveStr = args[1];
		} else {
			m.reply( 'Unexpected move input.' );
			return;
		}
		if ( game == null ) return;

		this.moveOrShowErr( m, game, moveStr );
		
	}

	async moveOrShowErr( m, game, moveStr ) {

		if ( !game.isOpen() ) {

			this.showGameStatus( m.channel, game );

		} else if ( game.turn === m.author.id ){

			if ( game.tryMove( moveStr ) ) {

				this.showGameStatus( m.channel, game );

				/// check game ended this turn.
				if ( !game.isOpen() ) {
					await this.gcache.completeGame( game );
				}

			} else {
				m.reply( moveStr + ' is not a legal move.');
			}

		} else {
			m.reply( 'It is not your turn to move.' );
		}

	}

	/**
	 * 
	 * @param {Channel} chan 
	 * @param {Game} game 
	 */
	showGameStatus( chan, game ) {
		chan.send( game.getStatusString() );
	}

	async startGame( w_user, b_user ) {

		let game = new ChessGame( w_user.id, b_user.id, Date.now() );

		await this.gcache.addNew( game );
		//console.log('creating game: ' + gid );
		return game;

	}

} // class

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