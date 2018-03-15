const ID_SEPARATOR = '-';


// regex template for user vs user.
const vsTmpl = "^(?:(U)\\" + ID_SEPARATOR + "(V)|(V)\\" + ID_SEPARATOR + "(U))(?:\\" + ID_SEPARATOR + "(\\d+))?$";

// regex template for all user's games.
const allUserTmpl = "^(?:(U)\\" + ID_SEPARATOR + "(\\w+)|(\\w+)\\" + ID_SEPARATOR + "(U))(?:\\" + ID_SEPARATOR + "(\\d+))?$";

module.exports = class Game {

	static IdParts( gid ) {
		let a = gid.split( ID_SEPARATOR );
		a.unshift(gid);
		return a;
	}

	/**
	 * Creates a regex that matches any game id for
	 * the given user.
	 * @param {string} uid 
	*/
	static UserRegex( uid ){
		return new RegExp( allUserTmpl.replace( /U/g, uid ) );
	}

	/**
	 * Creates a regex that matches all game ids for games between
	 * the given users.
	 * @param {string} p1 
	 * @param {string} p2 
	 */
	static VsRegex( p1, p2 ) {
		return new RegExp( vsTmpl.replace( /U/g, p1).replace(/V/g,p2) );
	}

	/**
	 * Id for a game still in progress. Once a game is over
	 * the timestamp is appended to the id.
	 * @param {User} user1 
	 * @param {User} user2 
	*/
	static ActiveGameID( user1, user2 ) {

		let id1 = user1.id;
		let id2 = user2.id;

		return ( id1 <= id2) ? ( id1 + ID_SEPARATOR + id2 ) : (id2 + ID_SEPARATOR + id1 );

	}

	static GameID( id1, id2, time ) {

		return ( this.id1<= this.id2) ? ( this.id1 + ID_SEPARATOR + this.id2 + ID_SEPARATOR + time ) :
		( this.id1 + ID_SEPARATOR + this.id2 + ID_SEPARATOR + time );

	}

	get saveID() { return this._saveID; }
	get shortID() { return this._gid; }
	get timestamp() { return this._time; }

	toJSON() {

		return {
			time:this._time,
			p1:this.p1,
			p2:this.p2
		};

	}

	constructor( id1, id2, time ) {

		this.p1 = id1;
		this.p2 = id2;
		this._time = time;

		this._saveID = this.getSaveId();
		this._gid = this.getActiveId();
	}

	/**
	 * Override in subclasses.
	*/
	isOpen() { return true; }

	/**
	 * Returns true if the player with the given id is playing this game.
	 * false otherwise.
	 * @param {string} uid - user id of player to check.
	 */
	hasPlayer( uid ) {
		return ( this.p1 === uid || this.p2 === uid );
	}

	getActiveId() {
		return ( this.p1 <= this.p2) ? ( this.p1 + ID_SEPARATOR + this.p2 ) : (this.p2 + ID_SEPARATOR + this.p1 );
	}

	/**
	 * Id for a game when saving to disk.
	*/
	getSaveId() {

		return ( this.p1 <= this.p2) ? ( this.p1 + ID_SEPARATOR + this.p2 + ID_SEPARATOR + this._time ) :
				( this.p1 + ID_SEPARATOR + this.p2 + ID_SEPARATOR + this._time );

	}

}