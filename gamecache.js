const Game = require( './game.js');
const dates = require( './datedisplay.js');

/**
 * Handles retrieval, store, and listings of user games.
*/
module.exports = class GameCache {

	constructor( context, basedir, revive=null ) {

		this.context = context;

		this.dir = basedir;
		this.cache = context.cache;

		this.reviver = revive;

		// userid -> active,completed games list.
		this.userLists = {};

	}

	async getUserLists( uid ) {

		let info = await this.context.fetchKeyData( this.dir + uid );
		if ( info ) return info;
		let o = { active:[], completed:[]};

		this.userLists[ uid ] = o;
		this.context.storeKeyData( this.dir + uid, o, true );

		return o;

	}

	async allGames( u1, u2 ) {

		let lists = await this.getUserLists( u1.id );
		let all = lists.active.concat( lists.completed );

		all = this.filterList( all, u2.id );
		all.sort( this.cmpMatches );

		return all;

	}

	/**
	 * Returns an array of all active games for the user.
	 * @param {Discord.User} user 
	 */
	async activeGames( u1, u2 ) {

		let list = await this.getUserLists( u1.id );

		if ( u2 ) return this.filterList( list.active, u2.id );

		console.log('returning active count: ' + list.active.length );

		return list.active;

	}

	async completedGames( u1, u2 ){

		let list = await this.getUserLists( u1.id );

		if (u2) return this.filterList( list.completed, u2.id );

		return list.completed;

	}

	/**
	 * Attempts to retrieve a uniquely active user game.
	 * Displays a message if multiple games are active.
	 * @param {Discord.Message} m 
	 * @param {Discord.User} u1 
	 */
	async activeOrErr( m, u1, u2=null, gnum=null) {

		//console.log( 'p1 not null. p2 null');
		let games = await this.activeGames( u1 );

		if ( u2 != null || gnum != null ) {
			console.log( 'filtering active list.')
			games = this.filterList( games, u2.id, gnum );
		}

		if ( games.length === 0 ) {

			m.reply( 'No games found.');

		} else if ( games.length > 1 ) {
			m.reply( 'Multiple games for ' + this.context.userString(u1) +
					' found.  Specify opponent in command.' );
		} else return await this.loadGame( games[0][0] );

	}

	async filterList( list, uid, gnum ) {

		let len = list.length;
		var results;
		var ginfo;

		if ( uid != null ) {

			results = [];
			for( let i = 0; i < len; i++ ) {

				ginfo = list[i];
				if ( ginfo[1] == uid || ginfo[2] == uid ) results.push( ginfo );

			}

		} else results = list;

		if ( gnum != null ) {

			gnum--;
			if ( gnum < 0 || gnum >= list.length ) return null;
			return [ list[gnum] ];

		}

		return results;

	}

	async getGame( u1, u2, num=null ) {

		try {

			let gameList = await this.activeGames(u1,u2);
			let gname;
	
			if ( num == null ) {
	
				// last active
				if ( gameList.length === 0 ) return;
				gname = gameList[ gameList.length-1 ][0];
	
			} else {
	
				num--;
				if ( num < 0 || num >= gameList.length ) return null;
				gname = gameList[num][0];
	
			}
	
			return await this.loadGame( gname );

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

			return await this.activeOrErr( m, p1 );

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

			return game;
		}


		} catch ( e ) {console.log(e); }

	}


	/**
	 * 
	 * @param {Game} game 
	*/
	async saveGame( game ) {
		await this.context.storeKeyData( this.dir + game.saveID, game, true );
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

		if ( data != null && this.reviver ) {

			let game = this.reviver( data );	//replace json with revived obj.

			if ( game != null ) {

				console.log('recaching parsed game.');
				this.context.cacheKeyData( this.dir + saveid, game );
				return game;
			}

		}

		return data;

	}

	async printGames( m, u1, u2 ) {

		let list = await this.activeGames( u1, u2 );

		m.reply( listToString(list ) );

	}

	/**
	 * 
	 * @param {*} ginfos [fullid, p1_id,p2_id,time]
	*/
	async listToString( ginfos ) {

		let len = ginfos.length;
		if ( len == 0 ) return 'No games found.';

		let res = '';

		for( let i = 0; i < len;) {

			var info = ginfos[i++];

			res += i + ') ' + await this.context.displayName( info[1] ) + ' vs '
				+ await this.context.displayName( info[2] ) + ': ' + new Date( parseInt(info[3])).toLocaleDateString() + '\n';

		}

		return res;

	}

	async addNew( game ) {

		let [ list1, list2 ] = await Promise.all( [this.getUserLists( game.p1 ), this.getUserLists( game.p2 )] );
		
		let info = Game.IdParts(game.saveID);

		if ( game.isOpen() ) {

			console.log('GAME IS OPEN');
			this.insertGame( list1.active, info );
			this.insertGame( list2.active, info );

		} else {

			console.log('GAME IS CLOSED');
	
			this.insertGame( list1.completed, info );
			this.insertGame( list2.completed, info );

		}

		await this.saveGame( game );

	}

	async completeGame( game ) {

		let [ list1, list2 ] = await Promise.all( [ this.getUserLists( game.p1 ), this.getUserLists( game.p2 )] );
		
		let info = Game.IdParts(game.saveID);

		this.removeGame( list1.active, info );
		this.removeGame( list2.active, info );

		this.insertGame( list1.completed, info );
		this.insertGame( list2.completed, info );

		await this.saveGame( game );

	}

	insertGame( list, ginfo ) {

		let min=0, max = list.length;
		let mid = Math.floor( (min + max)/2 );

		let gtime = ginfo[3];
		let id = ginfo[0];

		let cur;
		while ( min < max ) {

			cur = list[mid];

			if ( id === cur[0]) {
				console.log( 'ITEM: ' + id + ' ALREADY IN LIST.');
				return;		// already in list.
			} else if ( gtime < cur[3]) {
				max = mid;
			} else {
				min + mid+1;

			}
			mid = Math.floor( (min + max)/2 );

		} //

		console.log('ADDING ITEM AT: ' + mid );
 
		list.splice( mid, 0, ginfo );

	}

	removeGame( list, ginfo ) {

		let min=0, max = list.length;
		let mid = Math.floor( (min + max)/2 );

		let gtime = ginfo[3];
		let id = ginfo[0];

		let cur;
		while ( min < max ) {

			cur = list[mid];

			if ( id === cur[0] ) {

				console.log('REMOVING GAME: ' + id);
				return list.splice(mid,1)[0];

			} else if ( gtime < cur[3]) {
				max = mid;
			} else {
				min + mid+1;

			}
			mid = Math.floor( (min + max)/2 );

		} //

		console.log( 'GAME: ' + id  +' NOT REMOVED.');

	}

	/**
	 * 
	 * @param {RegExpMatchArray} a 
	 * @param {RegExpMatchArray} b 
	*/
	cmpMatches( a,b ) {
		let at = a[3], bt = b[3];

		if ( at === bt ) return ( a[0] > b[0]) ? 1 : -1;	// never happen;
		if ( at > bt ) return 1;
		return -1;
	}

} //