const Chess = require( 'chess-rules');
const Discord = require( 'discord.js');
const Game = require( './game.js');
const Display = require( './display.js' );
const Export = require( './export.js' );

const ID_SEPARATOR = '-';

let Room = exports.ContextClass = class {

	constructor( context ) {

		console.log('Creating chess instance.');

		this._context = context;
		this.activeGames = {};
		this.archiveGames = {};

	}

	async cmdPGN( m, opp1, opp2 ) {

		if ( opp1 == null ) opp1 = m.author;
		else if ( opp2 == null ) opp2 = m.author;

		let game = await this.gameOrShowErr( opp1, opp2 );
		if ( game == null ) return;

		try {

			let str = Export.toPGN( game );
			m.channel.send( str );

		} catch ( e) { console.log(e); }

	}

	async cmdResign( m, oppName ) {

		let game = await this.gameOrShowErr( m.channel, m.author, oppName );
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

		let game = await this.gameOrShowErr( m.channel, opp1, opp2 );
		if ( game != null ) {
			Display.showBoard( m.channel, game );
		}

	}

	async cmdNewGame( m, oppName, firstMove=null ) {

		try {
		if ( oppName == null ) {
			m.reply( 'Must specify an opponent.');
			return;
		}
		let opp = this._context.userOrShowErr( m.channel, oppName );
		if ( !opp ) return;

		let game = await this.getGame( m.author, opp );
		if ( game != null && game.status === 'OPEN' ) {
			this.tryPlayMove( m, game, firstMove );
			return;
		}

		if ( firstMove == null ){

			game = this.startGame( this.getGameId(m.author, opp), opp, m.author );

		} else {

			game = this.startGame( this.getGameId(m.author, opp), m.author, opp );
			if ( !game.tryMove( firstMove ) ) {
				m.reply( firstMove + ' is not a legal move.');
			}

		}

		Display.showBoard( m.channel, game );
	} catch( e) { console.log(e);}

		

	}

	async cmdDoMove( m, ...args ) {

		let len = args.length;
		let game, moveStr;
		if ( len == 0 ) {

			m.channel.send( 'Must specify a move.');
			return;

		} else if ( len == 1 ) {

			game = await this.gameOrShowErr( m.channel, m.author, null );
			moveStr = args[0];

		} else if ( len == 2 ) {
			// !move opponent moveStr
			game = await this.gameOrShowErr( m.channel, m.author, args[0]);
			moveStr = args[1];
		} else {
			m.channel.send( 'Unexpected move input.' );
			return;
		}
		if ( game == null ) return;

		this.tryPlayMove( m, game, moveStr );
		
	}

	tryPlayMove( m, game, moveStr ) {

		if ( game.status != 'OPEN') {

			this.showGameStatus( m.channel, game );

		} else if ( game.turn === m.author.id ){

			if ( game.tryMove( moveStr ) ) {

				this.showGameStatus( m.channel, game );

				/// check game ended this turn.
				if ( game.status != 'OPEN' ) {
					this.saveGame( game );
				}

			} else {
				m.channel.send( moveStr + ' is not a legal move.');
			}

		} else {
			m.channel.send( 'It is not your turn to move.' );
		}

	}

	showGameStatus( chan, game ) {
		chan.send( game.getStatusString() );
	}

	startGame( gid, w_user, b_user ) {

		try {
			let game = this.activeGames[gid] = new Game( w_user.id, b_user.id, Date.now() );
			//console.log('creating game: ' + gid );
			return game;

		} catch ( e) { console.log(e); }
		return null;
	}

	/**
	 * Attempts to find an active gamea between the given user
	 * and the named player.
	 * An error message is displayed to the channel on failure.
	 * @param {Discord.Channel} chan 
	 * @param {string|Discord.User} p1 
	 * @param {string|Discord.User} p2
	 * @returns {Game} The game being played.
	 */
	async gameOrShowErr( chan, p1, p2 ) {

		let game;

		try {
		if ( typeof(p1) == 'string' ) p1 = this._context.userOrShowErr( chan, p1 );
		if ( p1 == null ) {
			chan.send( 'Player not found.');
			return;
		}

		if ( p2 == null ) {

			//console.log( 'p1 not null. p2 null');
			let games = await this.findGames( p1 );

			if ( games.length == 0 ) {
				chan.send( 'No active games found.');
			} else if ( games.length > 1 ) {
				chan.send( 'Multiple games for ' + this._context.userString(p1) +
					' found.  Specify opponent in command.' );
			} else game = games[0];


		} else {

			if ( typeof(p2) == 'string' ) p2 = this._context.userOrShowErr( chan, p2 );
			if ( !p2 ) {
				chan.send( 'Second player not found.');
				return;
			};

			game = await this.getGame( p1, p2 );

			if ( game == null ) {
				chan.send( 'No game between ' + this._context.userString(p1) +
				' and ' + this._context.userString( p2 ) + ' found.' );
			}

		}

		return game;

	} catch ( e ) {console.log(e); }
	return null;
	}

	async getGame( user1, user2 ) {

		try {

			let gid = Game.getActiveId( user1, user2 );
			let game = this.activeGames[ gid ];
			if ( game == null ) {
				game = await this.loadActiveGame(gid);
			}
			return game;

		} catch ( e ) { console.log(e); }

	}

	/**
	 * Attempt to find an in-progress game in cache or disk.
	 * @param {} gid 
	 */
	async loadActiveGame( gid ) {

		let data = await this._context.fetchKeyData( 'chess/' + gid );
		if ( data != null ) {
			return Export.fromJSON( data );
		}

	}

	// find all boards played by user.
	async findGames( user ) {

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

	getGameId( user1, user2 ) {

		let id1 = user1.id;
		let id2 = user2.id;

		return ( id1 <= id2) ? ( id1 + ID_SEPARATOR + id2 ) : (id2 + ID_SEPARATOR + id1 );

	}

	/**
	 * 
	 * @param {Game} game 
	 */
	async saveGame( game ) {
		await this._context.storeKeyData( 'chess/' + game.getSaveId(), game );
	}

} // class

exports.init = async function( bot ){

	console.log( 'Chess INIT' );

	await Display.loadImages();

	bot.addContextCmd( 'chess', '!chess <opponentName> [firstMove]',
		Room.prototype.cmdNewGame, Room, {maxArgs:2} );

	bot.addContextCmd( 'chessmove', '!chessmove [opponentName] <moveString>',
		Room.prototype.cmdDoMove, Room, {maxArgs:2} );
	bot.addContextCmd( 'viewboard', '!viewboard [opponentName]',
		Room.prototype.cmdViewBoard, Room, {maxArgs:2} );

	bot.addContextCmd( 'resign', '!resign [opponentName]',
		Room.prototype.cmdResign, Room, { maxArgs:1} );

	bot.addContextCmd( 'pgn', '!pgn [opponentName]', Room.prototype.cmdPGN, Room, {maxArgs:2} );

} // init()