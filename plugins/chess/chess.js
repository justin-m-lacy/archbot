const Chess = require( 'chess-rules');
const jimp = require( 'jimp' );
const Discord = require( 'discord.js');
const ID_SEPARATOR = '-';

// image manip.
var imgBoard;
var imgPieces;
var tSize;

const teamRow = { 'W':1, 'B':0 };
const pieceCol = { 'Q':0, 'K':1, 'R':2, 'N':3, 'B':4, 'P': 5};

// maps chess letters to unicode chess characters.
const to_unicode = { 'K':'\u2654', 'Q':'\u2655', 'R':'\u2656',
						'B':'\u2657', 'N':'\u2658', 'P':'\u2659',
						'k':'\u265A', 'q':'\u265B', 'r':'\u265C',
						'b':'\u265D', 'n':'\u265E', 'p':'\u265F' };

let Room = exports.ContextClass = class {

	constructor( context ) {

		console.log('Creating chess instance.');

		this._context = context;
		this.activeGames = {};

	}

	cmdResign( m, oppName ) {

		let game = this.tryGetGame( m.channel, m.author, oppName );
		if ( game == null ) return;

		if ( game.status != 'OPEN' ) m.channel.send( 'The game is already over.');
		else {

			if ( game.w == m.author.id ) game.status = 'BLACKWON';
			else game.status = 'WHITEWON';

		}
		this.showGameStatus( m.channel, game );

	}

	async cmdViewBoard( m, oppName ) {

		let game = this.tryGetGame( m.channel, m.author, oppName );
		if ( game == null ) return;

		let attach = await this.getBoardImg(game);

		m.channel.send( this.getStatusString(game), attach );
		//m.channel.send( this.getBoardStr( game ) );

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
			if ( !this.doMove( game, firstMove ) ) {
				m.channel.send( firstMove + ' is not a legal move.');
				return;
			}

		}

		let attach = await this.getBoardImg(game);

		m.channel.send( this.getStatusString(game), attach );
		//m.channel.send( this.getBoardStr( game ));

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

		chan.send( this.getStatusString( game ) );

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

	async getBoardImg( game ) {

		try {
		let img = imgBoard.clone();
		let pieces = imgPieces;
	
		let b = game.board.board;

		let sqr, srcR, srcC;
		let i = 0, destRow = 7, destCol = 0;

		while ( i < 64 ) {
	
			sqr = b[i];
			if ( sqr != null ) {
	
				srcR = sqr.side == 'W' ? 1 : 0;
				srcC = pieceCol[ sqr.type ];
	
				img.composite( pieces, destCol*tSize, destRow*tSize, srcC*tSize, srcR*tSize, tSize, tSize );
	
			}
			destCol++; i++;
			if ( destCol == 8 ) {
				destCol=0;
				destRow--;
			}
	
		}
		
		let buff = await new Promise( (res,rej)=> {
			
		
			img.getBuffer( jimp.MIME_PNG, (err, buff)=>{
				if ( err ) res(null);
				else res( buff );
			} );
		
		});
	
		//console.log('returning attachment? ' + ( buff != null ));
		if ( buff != null ) return new Discord.Attachment( buff );

		} catch ( e ) { console.log(e); }

		return null;

	}

	getBoardStr( game ) {

		let b = game.board.board;
		let i = 0;
		let sqr;
		let row = [];
		let rows = [];

		let wasPiece = false;

		while ( i < 64 ) {

			sqr = b[i];
			if ( sqr == null ) {
				if ( wasPiece) row.push('. ')
				else row.push( '. ');
				wasPiece = false;
			} else {
				if ( sqr.side == 'B') row.push( to_unicode[sqr.type.toLowerCase()] );
				else row.push( to_unicode[sqr.type] );
				wasPiece = true;
			}

			
			if ( ++i % 8 == 0 ) {

				rows.unshift( row.join(' ') );
				row = [];
				wasPiece = false;
			}

		} //

		let res = '```';
		if ( game.lastMove != null ) res += ' ' + game.lastMove;

		return res + '\n' + rows.join( '\n') + '\n' + this.getStatusString(game) + '```';

	}

	doMove( game, moveStr ) {

		let turn = game.board.turn;

		let oldBoard = game.board;
		let move = Chess.pgnToMove( oldBoard, moveStr );
		if ( move == null ) { return false; }

		let newBoard = Chess.applyMove( oldBoard, move );

		//if ( newBoard == oldBoard ) return false;

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
			status:'OPEN',
			turn:w_user.id
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
			if ( game.w == id || game.b == id ) games.push(game);

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

		return ( id1 <= id2) ? ( id1 + ID_SEPARATOR + id2 ) : (id2 + ID_SEPARATOR + id1 );

	}

} // class

async function loadImages() {

	//console.time( 'load');

	try {
	imgBoard = await jimp.read( './images/board.png' );
	imgPieces = await jimp.read( './images/pieces.png');

	//console.timeEnd( 'load');

	tSize = Math.floor( imgBoard.bitmap.width / 8 );
	} catch(e) { console.log(e); }

}

exports.init = async function( bot ){

	try {

	console.log( 'Chess INIT' );

	await loadImages();

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