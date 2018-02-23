const Export = require( './export.js');
const Game = require( './game.js' );

const chessdir = 'chess';

/**
 * Archive class for dealing with prior games.
*/
module.exports = class {

	/**
	 * 
	 * @param {Context} context 
	 * @param {Cache} fileCache 
	 */
	constructor( context, fileCache ) {

		this._context = context;
		this._cache = fileCache;
		this.archiveGames = {};

		// list of all available.
		this.archiveList = {};

	}

	/**
	 * Load the list of all games available
	 * on file.
	*/
	async loadList() {

		let files = await context.getDataList( chessdir );

		let len = files.length;
		let file;
		for( let i = 0; i < files.length; i++ ) {

			file = files[i];
			this.archiveList[file] = true;

		}

		return this.archiveList;

	}

	async archiveGame( game ) {
	}

	async loadArchive( game, date ) {
	}

}