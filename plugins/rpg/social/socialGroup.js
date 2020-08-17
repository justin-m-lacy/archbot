/**
 * Any named group of players.
 * (Parties, Guilds, CombatGroups? etc)
 */
module.exports = class SocialGroup {

	/**
	 * @property {string} name - Name of group.
	 */
	get name() { return this._name; }
	set name(v) { this._name = v;}

	/**
	 * @property {string} leader - group leader.
	 */
	get leader() { return this._leader;}
	set leader(v) { this._leader = v;}

	/**
	 * @property {string[]} roster - Names of characters in the group.
	 */
	get roster() { return this._roster; }
	set roster(v) { this._roster = v;}

	/**
	 * @property {string[]} invites - Active invites to join the group.
	 */
	get invites() { return this._invites; }
	set invites(v) { this._invites = v; }

	constructor(){

		this._invites = [];
		this._roster = [];

	}

	/**
	 * Invite character to group.
	 * @param {Char} char
	 */
	invite(char) {

		let name = char.name;

		if ( this._invites.includes(name) || this._roster.includes(name ) ) return;
		this._invites.push(name);

	}

	/**
	 * Accept character in group. Character was confirmed.
	 * @param {*} char
	 * @returns {boolean}
	 */
	acceptInvite( char ) {

		let name = char.name;

		// prevent double join errors, but return success.
		if ( this.roster.includes(name ) ) return true;

		let ind = this.invites.indexOf( name );
		if ( ind >= 0 ) {

			this.invites.splice(ind, 1);
			this.roster.push( name );

			return true;

		} else return false;

	}

	async randChar() {
		return this._cache.fetch( this.roster[ Math.floor( this.roster.length*Math.random() )] );
	}

	/**
	 *
	 * @param {string} name
	 * @returns true if the party should be removed. false otherwise.
	 */
	leave( char ) {

		let name = char.name;
		let ind = this._roster.indexOf( name );
		if ( ind >= 0 ) {

			this._roster.splice(ind, 1);
			if ( this._roster.length === 0 ||
				(this._roster.length === 1 && this._invites.length === 0) ) return true;

			if ( this._leader === name ) this._leader = this._roster[0];

		}
		return false;
	}

	/**
	 *
	 * @param {string|Char} char
	 */
	includes( char ) {
		return typeof char === 'string' ?
			this._roster.includes(char) :
			this._roster.includes(char.name);
	}

	isLeader( char ) { return this._leader === char.name; }

	setLeader(char) {

		let name = (typeof(char) === 'string') ? char : char.name;
		if ( !this.roster.includes(name)) return false;

		this.leader = name;
		return true;

	}

	getList() {
		return this._name + ":\n" + this._roster.join('\n');
	}

}