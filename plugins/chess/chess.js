const Chess = require( 'chess-rules');
const Discord = require( 'discord.js');
const Game = require( './game.js');
const Display = require( './display.js' );

const ID_SEPARATOR = '-';

let Room = exports.ContextClass = class {

	constructor( context ) {

		console.log('Creating chess instance.');

		this._context = context;
		this.activeGames = {};

	}

	cmdResign( m, oppName ) {

		let game = this.tryGetGame( m.channel, m.author, oppName );
		if ( game == null ) return;

		if ( !game.tryResign() ) {
			m.channel.send( 'The game is already over.');
		}

		this.showGameStatus( m.channel, game );

	}

	async cmdViewBoard( m, oppName ) {

		let game = this.tryGetGame( m.channel, m.author, oppName );
		if ( game == null ) return;

		Display.showBoard( m.channel, game );

	}

	async cmdNewGame( m, oppName, firstMove=null ) {

		if ( oppName == null ) {
			m.channel.send( 'Must specify an opponent.');
			return;
		}
		let opp = this._context.tryGetUser( m.channel, oppName );
		if ( !opp ) return;

		let game = this.getGame( m.author, opp );
		if ( game != null ) {
			m.channel.send( 'You are already playing a game against ' + oppName + '.');
			return;
		}

		if ( firstMove == null ){

			game = this.startGame( this.getGameId(m.author, opp), opp, m.author );

		} else {

			game = this.startGame( this.getGameId(m.author, opp), m.author, opp );
			if ( !game.tryMove( game, firstMove ) ) {
				m.channel.send( firstMove + ' is not a legal move.');
				return;
			}

		}

		Display.showBoard( m.channel, game );

	}

	cmdDoMove( m, ...args ) {

		let len = args.length;
		let game, moveStr;
		if ( len == 0 ) {

			m.channel.send( 'Must specify a move.');
			return;

		} else if ( len == 1 ) {

			game = this.tryGetGame( m.channel, m.author, null );
			moveStr = args[0];

		} else {
			game = this.tryGetGame( m.channel, m.author, args[0]);
			moveStr = args[1];
		}

		if ( game == null ) return;

		if ( game.status != 'OPEN') {

			this.showGameStatus( m.channel, game );

		} else if ( game.turn === m.author.id ){

			if ( game.tryMove( game, moveStr ) ) {
				this.showGameStatus( m.channel, game );
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
		return this.activeGames[gid] = new Game( w_user.id, b_user.id );
	}

	/**
	 * Attempts to find an active gamea between the given user
	 * and the named player.
	 * An error message is displayed to the channel on failure.
	 * @param {Discord.Channel} chan 
	 * @param {Discord.User} user 
	 * @param {string} oppName
	 * @returns {Game} The game being played.
	 */
	tryGetGame( chan, user, oppName ) {

		let game;

		if ( oppName == null ) {

			let games = this.findGames( user );
			if ( games.length == 0 ) {
				chan.send( 'No active games found.');
			} else if ( games.length > 1 ) {
				chan.send( 'Multiple games found. Specify opponent in command.' );
			} else {
				game = games[0];
			}

		} else {

			let opp = this._context.tryGetUser( chan, oppName );
			if ( !opp ) return;
			game = this.getGame( user, opp );
			if ( game == null ) {
				chan.send( 'No game with ' + oppName + ' found.' );
			}

		}

		return game;

	}

	// find all boards played by user.
	findGames( user ) {

		let games = [];
		let id = user.id;
		let game;

		for( let gid in this.activeGames ) {

			game = this.activeGames[gid];
			if ( game.hasPlayer(id)) games.push(game);

		}

		return games;

	}

	getGame( user1, user2 ) {
		return this.activeGames[ this.getGameId(user1, user2 ) ];
	}

	getGameId( user1, user2 ) {

		let id1 = user1.id;
		let id2 = user2.id;

		return ( id1 <= id2) ? ( id1 + ID_SEPARATOR + id2 ) : (id2 + ID_SEPARATOR + id1 );

	}

} // class

exports.init = async function( bot ){

	try {

	console.log( 'Chess INIT' );

	await Display.loadImages();

	bot.addContextCmd( 'chess', '!chess opponentName [firstMove]',
		Room.prototype.cmdNewGame, Room, { type:'instance', maxArgs:2} );

	bot.addContextCmd( 'move', '!move [opponentName] moveString',
		Room.prototype.cmdDoMove, Room, {type:'instance', maxArgs:2} );
	bot.addContextCmd( 'viewboard', '!viewboard [opponentName]',
		Room.prototype.cmdViewBoard, Room, {type:'instance', maxArgs:1} );

	bot.addContextCmd( 'resign', '!resign [opponentName]',
		Room.prototype.cmdResign, Room, {type:'instance', maxArgs:1} );

	} catch ( e ) { console.log(e); }

} // init()