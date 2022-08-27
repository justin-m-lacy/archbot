import { User, Message } from 'discord.js';
import Game from './game';

/**
 * full_game_id, player1_id, player2_id, start_timestamp
 */
export type GameInfo = [string, string, string, string];

/**
 * @classdesc Handles retrieval, storing, and listings of user games.
*/
export default class GameCache {

	private context: any;
	private dir: string;
	private cache: any;
	private reviver: any;

	private userLists: { [key: string]: any };


	constructor(context: any, basedir: string, revive = null) {

		this.context = context;

		this.dir = basedir;
		this.cache = context.cache;

		this.reviver = revive;

		// userid -> active,completed games list.
		this.userLists = {};

	}

	/**
	 * @async
	 * @param {string} uid
	 * @returns { Promise<{active:Array, completed:Array}> }
	 */
	async getUserLists(uid: string) {

		const info = await this.context.fetchData(this.dir + uid);
		if (info) return info;
		const o = { active: [], completed: [] };

		this.userLists[uid] = o;
		this.context.storeData(this.dir + uid, o, true);

		return o;

	}

	/**
	 * @async
	 * @param {User} u1
	 * @param {User} u2
	 */
	async allGames(u1: User, u2: User) {

		const lists = await this.getUserLists(u1.id);
		let all = lists.active.concat(lists.completed);

		all = this.filterList(all, u2);
		all.sort(this.cmpMatches);

		return all;

	}

	/**
	 * Returns an array of all active games for the user.
	 * @async
	 * @param {Discord.User} user
	 * @returns {Promise<Array>}
	 */
	async activeGames(u1: User, u2?: User) {

		const list = await this.getUserLists(u1.id);

		if (u2) return this.filterList(list.active, u2);

		return list.active;

	}

	/**
	 * Returns an array of complted games for a user.
	 * @param {Discrd.User} u1
	 * @param {Discord.User} [u2=null]
	 * @returns {Promise<Array>}
	 */
	async completedGames(u1: User, u2?: User) {

		const list = await this.getUserLists(u1.id);

		if (u2) return this.filterList(list.completed, u2);

		return list.completed;

	}

	/**
	 * Attempts to retrieve a uniquely active user game.
	 * Displays a message if multiple games are active.
	 * @param {Discord.Message} m
	 * @param {Discord.User} u1
	 * @param {Discord.User} [u2=null]
	 * @param {?number} [gnum=null]
	 * @returns {Promise}
	 */
	async activeOrErr(m: Message, u1: User, u2?: User | null, gnum?: number) {

		//console.log( 'p1 not null. p2 null');
		let games = await this.activeGames(u1);

		if (u2 || gnum) games = this.filterList(games, u2, gnum);

		if (games.length === 0) {

			m.reply('No games found.');

		} else if (games.length > 1) {
			m.reply('Multiple games for ' + this.context.userString(u1) +
				' found. Include opponent in command.');
		} else return this.loadGame(games[0][0]);

	}


	/**
	 * @async
	 * @param {*} u1
	 * @param {*} u2
	 * @param {?number} num
	 * @returns {Promise}
	 */
	async getGame(u1: User, u2: User, num?: number) {

		try {

			const gameList = await this.activeGames(u1, u2);
			let gname;

			if (num) {

				num--;
				if (num < 0 || num >= gameList.length) return null;
				gname = gameList[num][0];

			} else {

				console.log('num games: ' + gameList.length);
				// last active
				if (gameList.length === 0) return;
				gname = gameList[gameList.length - 1][0];
				console.log('gname: ' + gname);

			}

			return await this.loadGame(gname);

		} catch (e) { console.error(e); }

	}

	/**
	 * @async
	 * @param {Message} m
	 * @param {*} p1
	 * @param {*} p2
	 * @param {*} gnum
	 * @returns {Promise<Game|null>}
	 */
	async gameOrSendErr(m: Message, p1: string | User | null, p2: string | User | null, gnum?: number) {

		try {

			const u1 = (typeof p1 !== 'string') ? p1 : this.context.userOrSendErr(m, p1);
			if (!p1) {
				m.reply('Player not found.');
				return null;
			}

			if (!p2) {

				return this.activeOrErr(m, u1);

			} else {

				if (typeof (p2) === 'string') p2 = this.context.userOrSendErr(m, p2);
				if (!p2) {
					m.reply('Second player not found.');
					return null;
				};

				const game = await this.getGame(p1 as User, p2 as User, gnum);

				if (!game) {
					m.reply('No game between ' + this.context.userString(p1) +
						' and ' + this.context.userString(p2) + ' found.');
				}

				return game;
			}


		} catch (e) { console.error(e); }

		return null;
	}


	/**
	 * @async
	 * @param {Game} game
	*/
	async saveGame(game: Game) {
		await this.context.storeData(this.dir + game.saveID, game, true);
	}

	/**
	 * Load a game.
	 * @async
	 * @param {string} saveid
	 * @returns {Promise<Game>}
	*/
	async loadGame(saveid: string) {

		let data = await this.context.fetchData(this.dir + saveid);

		if (data instanceof Game) {
			console.log('LOADED DATA ALREADY GAME');
		} else if (data != null && this.reviver) {

			let game = this.reviver(data);	//replace json with revived obj.

			if (game) {

				console.log('recaching parsed game.');
				this.context.cacheData(this.dir + saveid, game);
				return game;
			}

		}

		return data;

	}

	/**
	 * @async
	 * @param {Message} m
	 * @param {*} u1
	 * @param {*} u2
	 * @returns {Promise}
	 */
	async printGames(m: Message, u1: User, u2?: User) {

		let list = await this.activeGames(u1, u2);
		return m.reply(await this.listToString(list));

	}

	/**
	 * @async
	 * @param {*} ginfos [fullid, p1_id,p2_id,time]
	 * @returns {Promise}
	*/
	async listToString(ginfos: GameInfo[]) {

		let len = ginfos.length;
		if (len == 0) return 'No games found.';

		let res = '';

		for (let i = 0; i < len;) {

			var info = ginfos[i++];

			res += i + ') ' + await this.context.displayName(info[1]) + ' vs '
				+ await this.context.displayName(info[2]) + ': ' + new Date(info[3]).toLocaleDateString() + '\n';

		}

		return res;

	}

	/**
	 * @async
	 * @param {Game} game
	 */
	async addNew(game: Game) {

		let [list1, list2] = await Promise.all([this.getUserLists(game.player1Id), this.getUserLists(game.player2Id)]);

		let info = Game.IdParts(game.saveID);

		if (game.inProgress()) {

			console.log('GAME IS OPEN');
			this.insertGame(list1.active, info);
			this.insertGame(list2.active, info);

		} else {

			console.log('GAME IS CLOSED');

			this.insertGame(list1.completed, info);
			this.insertGame(list2.completed, info);

		}

		await this.saveGame(game);

	}

	/**
	 * @param {*} list
	 * @param {Discord.User} [user=null]
	 * @param {?number} [gnum=null]
	 */
	filterList(list: GameInfo[], user: User | null = null, gnum?: number) {

		let len = list.length;
		var results;
		var ginfo;

		if (user != null) {

			let id = user.id;
			results = [];
			for (let i = 0; i < len; i++) {

				ginfo = list[i];
				if (ginfo[1] === id || ginfo[2] === id) results.push(ginfo);

			}

		} else results = list;

		if (gnum != null) {

			gnum--;
			if (gnum < 0 || gnum >= list.length) return null;
			return [list[gnum]];

		}

		return results;

	}

	/**
	 * @async
	 * @param {Game} game
	 * @returns {Promise}
	 */
	async completeGame(game: Game) {

		let [list1, list2] = await Promise.all(
			[
				this.getUserLists(game.player1Id),
				this.getUserLists(game.player2Id)
			]);

		let info = Game.IdParts(game.saveID);

		this.removeGame(list1.active, info);
		this.removeGame(list2.active, info);

		this.insertGame(list1.completed, info);
		this.insertGame(list2.completed, info);

		await this.saveGame(game);

	}

	insertGame(list: GameInfo[], ginfo: GameInfo) {

		let min = 0, max = list.length;
		let mid = Math.floor((min + max) / 2);

		let gtime = ginfo[3];
		let id = ginfo[0];

		let cur;
		while (min < max) {

			cur = list[mid];

			if (id === cur[0]) {
				console.log('ITEM: ' + id + ' ALREADY IN LIST.');
				return;		// already in list.
			} else if (gtime < cur[3]) {
				max = mid;
			} else {
				min = mid + 1;

			}
			mid = Math.floor((min + max) / 2);

		} //

		console.log('ADDING ITEM AT: ' + mid);

		list.splice(mid, 0, ginfo);

	}

	/**
	 * Remove a game from a games list.
	 * @param {Array[]} list
	 * @param {[string,string,string]} ginfo
	 */
	removeGame(list: GameInfo[], ginfo: GameInfo) {

		let min = 0, max = list.length;
		let mid = Math.floor((min + max) / 2);

		let gtime = ginfo[3];
		let id = ginfo[0];

		let cur;
		while (min < max) {

			cur = list[mid];

			if (id === cur[0]) {

				console.log('REMOVING GAME: ' + id);
				return list.splice(mid, 1)[0];

			} else if (gtime < cur[3]) {
				max = mid;
			} else {
				min = mid + 1;

			}
			mid = Math.floor((min + max) / 2);

		} //

		console.error('GAME: ' + id + ' NOT REMOVED.');

	}

	/**
	 *
	 * @param {RegExpMatchArray} a
	 * @param {RegExpMatchArray} b
	 * @returns {number}
	*/
	cmpMatches(a: RegExpMatchArray, b: RegExpMatchArray) {
		let at = a[3], bt = b[3];

		if (at === bt) return (a[0] > b[0]) ? 1 : -1;	// never happen;
		if (at > bt) return 1;
		return -1;
	}

} //