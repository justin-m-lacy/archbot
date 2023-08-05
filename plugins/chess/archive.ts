import { BotContext, ContextSource } from '@src/bot/botcontext';
const Export = require('./export');
const Game = require('./game');

const chessdir = 'chess';

/**
 * Archive class for dealing with prior games.
*/
export default class Archive {

	private _context: BotContext<ContextSource>;

	private readonly archiveGames: object;
	private readonly archiveList: { [key: string]: any };

	_cache: any;

	/**
	 *
	 * @param {Context} context
	 * @param {Cache} fileCache
	 */
	constructor(context: BotContext<ContextSource>, fileCache: any) {

		this._context = context;
		this._cache = fileCache;
		this.archiveGames = {};

		// list of all available.
		this.archiveList = {};

	}

	/**
	 * Load the list of all games available
	 * on file.
	 * @returns {Promise}
	*/
	async loadList() {

		let files = await this._context.getDataList(chessdir) as string[];

		const len = files.length;
		for (let i = 0; i < len; i++) {

			const file = files[i];
			this.archiveList[file] = true;

		}

		return this.archiveList;

	}

	/*async archiveGame(game) {
	}

	async loadArchive(game, date) {
	}*/

}