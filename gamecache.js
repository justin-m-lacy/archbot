const Game = require( './game.js');

/**
 * Handles retrieval, store, and listings of user games.
*/
module.exports = class GameCache {

	constructor( context, basedir ) {

		this.context = context;

		this.dir = basedir;
		this.cache = cache;

		this.activeGames = {};

		this.games_list = {};

	}

	async fetchGamesList() {
	
		if ( this.games_list == null) this.games_list = {};

		let glist = await this.context.getDataList( this.dir );
		for( let i = glist.length-1; i >= 0; i-- ){

			this.games_list[glist[i]] = true;
		}

		return this.games_list;

	}

	/**
	 * Returns a list of all games between two players.
	 * @param {*} p1 
	 * @param {*} p2 
	 */
	async allVs( p1, p2 ) {

		if ( this.games_list == null ) this.games_list = await this.fetchGamesList();

		let regex = Game.VsRegex( p1.id, p2.id );

		let matches = [];
		let match;
		for( let k in this.games_list ) {

			match = k.match( reg );
			if ( match ){
				console.log( 'game found: ' + match[0] + ( match.length==2? '  TIME: ' + match[1] : '') );
				matches.push( match );
			}

		} //

		matches.sort( this.cmpMatches );
		console.log( 'total matches found: ' + matches.length );

		return matches;

	}

	/**
	 * Find all games saved by user.
	 * @param {User} user
	 * @returns {RegExpMatchArray[]} array of [gameName, timestamp] values.
	*/
	async allUserGames( user ) {

		if ( this.games_list == null ) this.games_list = await this.fetchGamesList();

		let regex = Game.UserRegex( user.id );

		let matches = [];
		let match;
		for( let k in this.games_list ) {

			match = k.match( reg );
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
	 * 
	 * @param {RegExpMatchArray} a 
	 * @param {RegExpMatchArray} b 
	 */
	cmpMatches( a,b ) {
		let at = a[1];
		let bt = b[1];

		if ( at === bt ) return 0;	// never happen;
		// recent games first.
		if ( at > bt ) return -1;
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
	 * 
	 * @param {Discord.Message} m 
	 * @param {Discord.User} user 
	 */
	async printGames( m, user ) {

		let games = await this.allUserGames( user );

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

} //