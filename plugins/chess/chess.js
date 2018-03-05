const Chess = require( 'chess-rules');
const Discord = require( 'discord.js');
const ChessGame = require( './chessgame.js');
const Display = require( './display.js' );
const Export = require( './export.js' );

const GameCache = require( '../../gamecache.js');

const game_dir = 'chess/';

class Room {

	constructor( context ) {

		this._context = context;
		this.activeGames = {};

		this.games = new GameCache( context, game_dir );

	}

	async cmdShowGames( m, player ) {

		try {

			if ( player == null ) player = m.author;
			else {
				player = this._context.userOrShowErr( m.channel, player );
				if ( player == null) return;
			}

			this.games.printGames( m, player );

		} catch ( e ) { console.log(e);}

	}

	async cmdNewGame( m, oppName, firstMove=null ) {

		try {

			let opp = this._context.userOrShowErr( m.channel, oppName );
			if ( !opp ) return;

			let game = await this.getGame( m.author, opp );
			if ( game != null && game.isOpen() ) {
				return this.moveOrShowErr( m, game, firstMove );
			}

			if ( firstMove == null ){

				game = this.startGame( ChessGame.ActiveGameID(m.author, opp), opp, m.author );

			} else {

				game = this.startGame( ChessGame.ActiveGameID(m.author, opp), m.author, opp );
				this.moveOrShowErr( m, game, firstMove );

			}

			Display.showBoard( m.channel, game );
		} catch( e) { console.log(e);}

	}

	async cmdPGN( m, opp1, opp2 ) {

		if ( opp1 == null ) opp1 = m.author;
		else if ( opp2 == null ) opp2 = m.author;

		let game = await this.gameOrShowErr( m, opp1, opp2 );
		if ( game == null ) return;

		try {

			let str = Export.toPGN( game );
			m.channel.send( str );

		} catch ( e) { console.log(e); }

	}

	async cmdResign( m, oppName ) {

		let game = await this.gameOrShowErr( m, m.author, oppName );
		if ( game == null ) return;

		if ( !game.tryResign() ) {
			m.channel.send( 'The game is already over.');
		}

		this.showGameStatus( m.channel, game );

	}

	async cmdViewBoard( m, opp1, opp2 ) {

		if ( opp1 == null ) {
			opp1 = m.author;
		}
		else if ( opp2 == null ) {
			opp2 = m.author;
		}

		let game = await this.gameOrShowErr( m, opp1, opp2 );
		if ( game != null ) {
			Display.showBoard( m.channel, game );
		}

	}

	async cmdDoMove( m, ...args ) {

		let len = args.length;
		let game, moveStr;
		if ( len == 0 ) {

			m.reply( 'Must specify a move.');
			return;

		} else if ( len == 1 ) {

			game = await this.gameOrShowErr( m, m.author, null );
			moveStr = args[0];

		} else if ( len == 2 ) {
			// !move opponent moveStr
			game = await this.gameOrShowErr( m, m.author, args[0]);
			moveStr = args[1];
		} else {
			m.reply( 'Unexpected move input.' );
			return;
		}
		if ( game == null ) return;

		this.moveOrShowErr( m, game, moveStr );
		
	}

	moveOrShowErr( m, game, moveStr ) {

		if ( !game.isOpen() ) {

			this.showGameStatus( m.channel, game );

		} else if ( game.turn === m.author.id ){

			if ( game.tryMove( moveStr ) ) {

				this.showGameStatus( m.channel, game );

				/// check game ended this turn.
				if ( !game.isOpen() ) {
					this.games.saveGame( game );
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

	startGame( gid, w_user, b_user ) {

		let game = this.activeGames[gid] = new ChessGame( w_user.id, b_user.id, Date.now() );
		//console.log('creating game: ' + gid );
		return game;

	}

	/**
	 * Attempts to find an active gamea between the given user
	 * and the named player.
	 * An error message is displayed to the channel on failure.
	 * @param {Discord.Message} m 
	 * @param {string|Discord.User} p1 
	 * @param {string|Discord.User} p2
	 * @returns {Game} The game being played.
	 */
	async gameOrShowErr( m, p1, p2 ) {

		try {

		if ( typeof(p1) === 'string' ) p1 = this._context.userOrShowErr( m, p1 );
		if ( !p1 ) {
			m.reply( 'Player not found.');
			return;
		}

		if ( p2 == null ) {

			return this.getActive( m, p1 );


		} else {

			if ( typeof(p2) === 'string' ) p2 = this._context.userOrShowErr( m, p2 );
			if ( !p2 ) {
				m.reply( 'Second player not found.');
				return;
			};

			let game = await this.getGame( p1, p2 );

			if ( !game ) {
				m.reply( 'No game between ' + this._context.userString(p1) +
				' and ' + this._context.userString( p2 ) + ' found.' );
			}

		}

		return game;

		} catch ( e ) {console.log(e); }

	}

	/**
	 * Attempts to retrieve the active game of user,
	 * and reports an error if no game is found,
	 * or if multiple games are found.
	 * @param {Discord.Message} m 
	 * @param {Discord.User} user 
	 */
	async getActive( m, user ) {

		//console.log( 'p1 not null. p2 null');
		let games = await this.activeUserGames( user );

		if ( games.length === 0 ) {
			m.reply( 'No active games found.');
		} else if ( games.length > 1 ) {
			m.reply( 'Multiple games for ' + this._context.userString(user) +
					' found.  Specify opponent in command.' );
		} else return games[0];

	}

	async getGame( user1, user2 ) {

		try {

			let gid = ChessGame.ActiveGameID( user1, user2 );
			let game = this.activeGames[ gid ];

			if ( game ) return game;
			return await this.loadActiveGame(gid);

		} catch ( e ) { console.log(e); }

	}

	/**
	 * Attempt to find an in-progress game in cache or disk.
	 * @param {} gid 
	 */
	async loadActiveGame( gid ) {

		let data = await this._context.fetchKeyData( game_dir + gid );
		if ( data ) {
			let game = Export.fromJSON( data );
			this._context.storeKeyData( game_dir + gid, game ); //replace json data.
		}

	}

	// find all active boards played by user.
	async activeUserGames( user ) {

		let games = [];
		let id = user.id;
		let game;

		//console.log('searching games for: ' + id );
		for( let gid in this.activeGames ) {

			game = this.activeGames[gid];
			if ( game.hasPlayer(id) ) games.push(game);

		}

		return games;

	}


} // class

exports.init = async function( bot ) {

	console.log( 'Chess INIT' );

	await Display.loadImages();

	bot.addContextCmd( 'chessgames', '!chessgames [player]', Room.prototype.cmdShowGames, Room, {maxArgs:1} );

	bot.addContextCmd( 'chess', '!chess <opponentName> [firstMove]',
		Room.prototype.cmdNewGame, Room, {maxArgs:2} );

	bot.addContextCmd( 'chessmove', '!chessmove [opponentName] <moveString>',
		Room.prototype.cmdDoMove, Room, {maxArgs:2} );
	bot.addContextCmd( 'chessboard', '!chessboard [opponentName]',
		Room.prototype.cmdViewBoard, Room, {maxArgs:2} );

	bot.addContextCmd( 'resign', '!resign [opponentName]',
		Room.prototype.cmdResign, Room, { maxArgs:1} );

	bot.addContextCmd( 'pgn', '!pgn [opponentName]', Room.prototype.cmdPGN, Room, {maxArgs:2} );

} // init()