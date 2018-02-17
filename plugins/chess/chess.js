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

		m.channel.send( this.getBoardStr( game ) );

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

		m.channel.send( this.getBoardStr( game ));

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

		} else if ( game.turn == m.author.id ){

			if ( this.doMove( game, moveStr ) ) {
				this.showGameStatus( m.channel, game );
			} else {
				m.channel.send( moveStr + ' is not a legal move.');
			}

		} else {
			m.channel.send( 'It is not your turn to move.' );
		}

	}

	showGameStatus( chan, game ) {

		chan.send( this.getStatusString( game.status ) );

	}

	getStatusString( game ) {

		let status = game.status;

		if ( status == 'WHITEWON') {
			return 'White has won the game.';
		} else if ( status == 'BLACKWON') {
			return 'Black has won the game.';
		} else if ( status == 'PAT') {
			return 'The game is a stalemate.';
		}
		return ( game.board.turn === 'W') ? 'White to move.' : 'Black to move.';

	}

	getBoardStr( game ) {

		let b = game.board.board;
		let i = 0;
		let sqr;
		let row = [];
		let rows = [];

		while ( i < 64 ) {

			sqr = b[i];
			if ( sqr == null ) {
				row.push( ' . ');
			} else {
				if ( sqr.side == 'B') row.push(sqr.type.toLowerCase() );
				else row.push( sqr.type );
			}

			
			if ( ++i % 8 == 0 ) {

				rows.unshift( row.join(' ') );
				row = [];

			}

		} //

		return game.lastMove + '\n' + rows.join( '\n') + '\n' + this.getStatusString(game);

	}

	doMove( game, moveStr ) {

		let turn = game.board.turn;

		let oldBoard = game.board;
		let move = Chess.pgnToMove( oldBoard, moveStr );
		let newBoard = Chess.applyMove( oldBoard, move );

		if ( newBoard == oldBoard ) return false;

		game.board = newBoard;
		game.lastMove = turn + ' ' + moveStr;
		game.status = Chess.getGameStatus( newBoard );

		if ( turn === 'W') game.turn = game.b;
		else game.turn = game.w;

		return true;

	}

	onMessage( m ) {
	}

	startGame( gid, w_user, b_user ) {

		var game = this.activeGames[gid] = {
			board:Chess.getInitialPosition(),
			w:w_user.id, b:b_user.id,
			lastMove:'',
			status:'OPEN',
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