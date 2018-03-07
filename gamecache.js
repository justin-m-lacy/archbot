const Game = require( './game.js');

/**
 * Handles retrieval, store, and listings of user games.
*/
module.exports = class GameCache {

	constructor( context, basedir, revive=null ) {

		this.context = context;

		this.dir = basedir;
		this.cache = context.cache;

		this.reviver = revive;

		this.activeGames = {};
		this.games_list = null;

	}

	/**
	 * Attempts to retrieve a uniquely active user game.
	 * Displays a message if multiple games are active.
	 * @param {Discord.Message} m 
	 * @param {Discord.User} user 
	 */
	async activeOrErr( m, user ) {

		//console.log( 'p1 not null. p2 null');
		let games = await this.activeUserGames( user );

		if ( games.length === 0 ) {

			let game = this.getGame( user.id );
			if ( game ) return game;

			m.reply( 'No games found.');

		} else if ( games.length > 1 ) {
			m.reply( 'Multiple games for ' + this.context.userString(user) +
					' found.  Specify opponent in command.' );
		} else return games[0];

	}

	async getGame( user1, user2, gnum=null ) {

		try {

			if ( user2 != null && gnum == null ) {

				let gid = Game.ActiveGameID( user1, user2 );
				let game = this.activeGames[ gid ];

				if ( game ) return game;

			}

			return await this.getGameNum( user1, user2, gnum );

		} catch ( e ) { console.log(e); }

	}

	async gameOrShowErr( m, p1, p2, gnum=null ) {

		try {

		if ( typeof(p1) === 'string' ) p1 = this.context.userOrShowErr( m, p1 );
		if ( !p1 ) {
			m.reply( 'Player not found.');
			return;
		}

		if ( p2 == null ) {

			return this.activeOrErr( m, p1 );

		} else {

			if ( typeof(p2) === 'string' ) p2 = this.context.userOrShowErr( m, p2 );
			if ( !p2 ) {
				m.reply( 'Second player not found.');
				return;
			};

			let game = await this.getGame( p1, p2, gnum );

			if ( !game ) {
				m.reply( 'No game between ' + this.context.userString(p1) +
				' and ' + this.context.userString( p2 ) + ' found.' );
			}

		}

		return game;

		} catch ( e ) {console.log(e); }

	}

	/**
	 * Gets the numbered game, from oldest to newest,
	 * between two players or of a single player.
	 * @param {} p1 
	 * @param {} p2 
	 * @param {number} num 
	 */
	async getGameNum( p1, p2=null, num=null ) {

		let gameList = await this.userGameList(p1,p2);
		let gname;

		if ( num == null ) {

			if ( gameList.length === 0 ) return;
			gname = gameList[ gameList.length-1 ][0];

		} else {

			num--;
			if ( num < 0 || num >= gameList.length ) return null;
			let gname = gameList[num][0];

		}

		return await this.loadGame( gname );

	}

	/**
	 * Find all stored user games.
	 * @param {Discord.User} p1 
	 * @param {Discord.User|null} p2
	 */
	async userGameList( p1, p2=null ) {

		if ( this.games_list == null ) this.games_list = await this.fetchGamesList();

		let regex = ( p2 == null ) ? Game.UserRegex( p1.id ) : Game.VsRegex( p1.id, p2.id );

		console.log( 'regex test: ' + regex.toString() );

		let matches = [];
		let match;
		for( let k in this.games_list ) {

			match = k.match( regex );
			if ( match ){
				console.log( 'user game found: ' + match[0] + ( match.length==2? '  TIME: ' + match[1] : '') );
				matches.push( match );
			}

		} //

		matches.sort( this.cmpMatches );

		console.log( 'total matches found: ' + matches.length );

		return matches;

	}

	/**
	 * Returns a list of all active games for the
	 * given user.
	 * @param {Discord.User} user 
	 */
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

	/**
	 * 
	 * @param {RegExpMatchArray} a 
	 * @param {RegExpMatchArray} b 
	 */
	cmpMatches( a,b ) {
		let at = a[1], bt = b[1];

		if ( at === bt ) return 0;	// never happen;
		if ( at > bt ) return 1;
		return 1;
	}

	/**
	 * 
	 * @param {Game} game 
	*/
	async saveGame( game ) {

		this.activeGames[game.shortID] = game;
		let id = game.saveID;
		this.games_list[id] = true;
		await this.context.storeKeyData( this.dir + id, game );

	}

	/**
	 * Load a game.
	 * @param {string} saveid 
	*/
	async loadGame( saveid ) {

		let data = await this.context.fetchKeyData( this.dir + saveid );

		if ( data instanceof Game ) {
			console.log('LOADED DATA ALREADY GAME');
		}

		if ( data != null && !(data instanceof Game ) && this.reviver ) {

			data = this.reviver( data );	//replace json with revived obj.

			if ( data != null ) {

				console.log('recaching parsed game.');
				this.activeGames[data.shortID] = data;
				this.games_list[saveid] = true;
				this.context.cacheKeyData( this.dir + saveid, data );

			}

		}

		return data;

	}

	/**
	 * 
	 * @param {Discord.Message} m 
	 * @param {Discord.User} user 
	 */
	async printGames( m, p1, p2 ) {

		let games = await this.userGameList( p1, p2 );

		let res = '';
		let len = games.length;

		if ( len == 0 ) {
			m.reply( 'No active games found.');
			return;
		}

		let info;
		for( let i = 0; i < len;) {

			info = games[i++];
			res += (i) + ') ' + info[0] + '\n';

		}

		m.reply('```' + res + '```');

	}

	async fetchGamesList() {
	
		if ( this.games_list == null) this.games_list = {};

		let glist = await this.context.getDataList( this.dir );
		for( let i = glist.length-1; i >= 0; i-- ){

			console.log( 'game found: ' + glist[i] );
			this.games_list[glist[i]] = true;
		}

		return this.games_list;

	}

} //