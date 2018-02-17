const Chess = require( 'chess-rules');

exports.ContextClass = class {

	constructor( context ) {

		this._context = context;
		this.activeGames = {};

	}

	cmdViewBoard( m, oppName ) {

		if ( oppName == null ){
		}

	}

	cmdNewGame( m, oppName, firstMove=null ) {

		if ( oppName == null ) {
			m.send( 'Must specify an opponent.');
			return;
		}
		let opp = this._context.tryGetUser( m.channel, oppName );
		if ( !opp ) return;

		let game = this.getGame( m.author, opp );
		if ( game != null ) {
			m.send( 'You are already playing a game against ' + oppName + '.');
			return;
		}

		if ( firstMove == null ){

			game = this.startGame( this.getGameId(m.author, opp), opp, m.author );

		} else {

			game = this.startGame( this.getGameId(m.author, opp), m.author, opp );
			game.board = this.doMove( game.board, moveStr );

		}

		m.send( getBoardStr( game.board ));

	}

	cmdDoMove( m, oppName, moveStr ) {

		let opp = this._context.tryGetUser( m.channel, oppName );
		if ( !opp ) return;


	}

	getBoardStr( board ) {
		return Chess.positionToString( board, true );
	}

	doMove( board, moveStr ) {

		let move = Chess.pgnToMove( board, moveStr );
		return Chess.applyMove( board, move );

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

	// find all boards played by user.
	findBoard( user ) {
	}

	getGame( user1, user2 ) {

		let gid = this.getGameId(user1, user2 );
		return this.activeGames[gid];

	}

	getGameId( user1, user2 ) {

		let id1 = user1.id;
		let id2 = user2.id;

		return ( id1 < id2) ? ( id1 + '-' + id2 ) : (id2 + '-' + id1 );

	}

}