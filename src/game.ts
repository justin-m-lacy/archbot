import { GameInfo } from './gamecache';
const ID_SEPARATOR = '-';


// regex template for user vs user.
const vsTmpl = "^(?:(U)\\" + ID_SEPARATOR + "(V)|(V)\\" + ID_SEPARATOR + "(U))(?:\\" + ID_SEPARATOR + "(\\d+))?$";

// regex template for all user's games.
const allUserTmpl = "^(?:(U)\\" + ID_SEPARATOR + "(\\w+)|(\\w+)\\" + ID_SEPARATOR + "(U))(?:\\" + ID_SEPARATOR + "(\\d+))?$";

export default class Game {

	/**
	 * @static
	 * @param {string} gid
	 * @returns {Array} An array of game information in the form of
	 * the two player ids, followed by a timestamp.
	 */
	static IdParts(gid: string) {
		let a = gid.split(ID_SEPARATOR);
		a.unshift(gid);
		return a as GameInfo;
	}

	/**
	 * Creates a regex that matches any game id played
	 * by the user.
	 * @static
	 * @param {string} uid
	 * @returns {RegExp}
	*/
	static UserRegex(uid: string) {
		return new RegExp(allUserTmpl.replace(/U/g, uid));
	}

	/**
	 * Creates a regex that matches all game ids for the given users.
	 * @static
	 * @param {string} p1 
	 * @param {string} p2
	 * @returns {RegExp}
	 */
	static VsRegex(p1: string, p2: string) {
		return new RegExp(vsTmpl.replace(/U/g, p1).replace(/V/g, p2));
	}

	/**
	 * Id for a game still in progress. Once a game is over
	 * the timestamp is appended to the id.
	 * @static
	 * @param {User} user1 
	 * @param {User} user2
	 * @returns {string}
	*/
	/*static ActiveGameID( user1, user2 ) {

		let id1 = user1.id;
		let id2 = user2.id;

		return ( id1 <= id2) ? ( id1 + ID_SEPARATOR + id2 ) : (id2 + ID_SEPARATOR + id1 );

	}*/

	/**
	 * @static
	 * @param {string} id1 
	 * @param {string} id2 
	 * @param {number} time
	 * @returns {string}
	 */
	/*static GameID( id1, id2, time ) {

		return ( id1<= this.id2) ? ( id1 + ID_SEPARATOR + id2 + ID_SEPARATOR + time ) :
		( id1 + ID_SEPARATOR + id2 + ID_SEPARATOR + time );

	}*/

	/**
	 * {string} id for storage.
	 */
	get saveID() { return this._saveID; }

	/**
	 * {string} id for cache.
	 */
	get shortID() { return this._gid; }

	/**
	 * {number} unix timestamp of game start.
	 */
	get timestamp() { return this._time; }

	private _time: number;
	private _gid: string;
	private _saveID: string;

	get player1Id() {
		return this.p1;
	}

	get player2Id() {
		return this.p2;
	}

	/**
	 * player1 id.
	 */
	private p1: string;
	/**
	 * player 2 id
	 */
	private p2: string;

	/**
	 * 
	 * @param {string} id1 
	 * @param {string} id2 
	 * @param {number} time - unix timestamp of game start.
	 */
	constructor(id1: string, id2: string, time: number) {

		this.p1 = id1;
		this.p2 = id2;
		this._time = time;

		this._saveID = this.getSaveId();
		this._gid = this.getShortId();
	}

	/**
	 * Override in subclasses.
	 * @returns {boolean} true if game is still in progress.
	*/
	inProgress() { return true; }

	/**
	 * Check if a user id matches one of the players of the game.
	 * @param {string} uid - user id of player to check.
	 * @returns {boolean} true if one of the players has the given id.
	 */
	hasPlayer(uid: string) {
		return (this.p1 === uid || this.p2 === uid);
	}

	/**
	 * @returns {string}
	 */
	getShortId() {
		return (this.p1 <= this.p2) ? (this.p1 + ID_SEPARATOR + this.p2) : (this.p2 + ID_SEPARATOR + this.p1);
	}

	/**
	 * @returns {string} Id of game when saving to disk.
	*/
	getSaveId() {

		return (this.p1 <= this.p2) ? (this.p1 + ID_SEPARATOR + this.p2 + ID_SEPARATOR + this._time) :
			(this.p1 + ID_SEPARATOR + this.p2 + ID_SEPARATOR + this._time);

	}

	toJSON() {

		return {
			time: this._time,
			p1: this.p1,
			p2: this.p2
		};

	}

}