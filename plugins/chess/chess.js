const Chess = require( 'chess-rules');
const ID_SEPARATOR = '-';

let Room = exports.ContextClass = class {

	constructor( context ) {

		console.log('Creating chess instance.');

		this._context = context;
		this.activeGames = {};

		this._context.bindCommand( 'chess', this );
		this._context.bindCommand( 'move', this );
		this._context.bindCommand( 'viewboard', this );
	}

	cmdViewBoard( m, oppName ) {

		let game = this.tryGetGame( m.channel, m.author, oppName );
		if ( game == null ) return;

		m.channel.send( this.getBoardStr(game.board ) );

	}

	cmdNewGame( m, oppName, firstMove=null ) {

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
			this.doMove( game, firstMove );

		}

		m.channel.send( this.getBoardStr( game.board ));

	}

	cmdDoMove( m, ...args ) {

		let len = args.length;
		let game, moveStr;
		if ( len == 0 ) {

			m.channel.send( 'Must specify a move.');

		} else if ( len == 1 ) {

			game = this.tryGetGame( m.channel, m.author, null );
			moveStr = args[0];

		} else {
			game = this.tryGetGame( m.channel, m.author, args[0]);
			moveStr = args[1];
		}

		if ( game != null && game.turn == m.author.id ){

			this.doMove( game, moveStr );

		} else {
			m.channel.send( 'It is not your turn to move.' );
		}

	}

	getBoardStr( board ) {
		return Chess.positionToString( board );
	}

	doMove( game, moveStr ) {

		let move = Chess.pgnToMove( game.board, moveStr );
		game.board = Chess.applyMove( game.board, move );

		if ( game.board.turn == 'W') game.turn = game.w;
		else game.turn = game.b;

	}

	onMessage( m ) {
	}

	startGame( gid, w_user, b_user ) {

		var game = this.activeGames[gid] = {
			board:Chess.getInitialPosition(),
			w:w_user.id, b:b_user.id,
			turn:w_user
		};

		return game;

	}

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
				chan.send( 'No game with  ' + oppName + ' found.' );
			}

		}

		return game;

	}

	// find all boards played by user.
	findGames( user ) {

		let games = [];
		let sep;
		let id = user.id;
		for( let gid in this.activeGames ) {

			sep = gid.indexOf( ID_SEPARATOR );
			if ( gid.substring(0, sep) === id ) {
				games.push( this.activeGames[gid]);
			} else if ( gid.substring(sep+1) === id ) {
				games.push( this.activeGames[gid]);
			}

		}

		return games;

	}

	getGame( user1, user2 ) {

		let gid = this.getGameId(user1, user2 );
		return this.activeGames[gid];

	}

	getGameId( user1, user2 ) {

		let id1 = user1.id;
		let id2 = user2.id;

		return ( id1 < id2) ? ( id1 + ID_SEPARATOR + id2 ) : (id2 + ID_SEPARATOR + id1 );

	}

} // class

exports.init = function( discordbot ){

	bot = discordbot;
	console.log( 'Chess INIT' );

	let cmds = bot.dispatch;

	cmds.add( 'chess', '!chess opponentName [firstMove]',
		Room.prototype.cmdNewGame, { type:'instance', maxArgs:2} );

	cmds.add( 'move', '!move [opponentName] moveString',
		Room.prototype.cmdDoMove, {type:'instance', maxArgs:2} );
	cmds.add( 'viewboard', '!viewboard [opponentName]',
		Room.prototype.cmdViewBoard, {type:'instance', maxArgs:1} );

}