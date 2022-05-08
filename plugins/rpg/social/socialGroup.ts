import Char from '../char/char';
import Cache from 'archcache';
/**
 * Any named group of players.
 * (Parties, Guilds, CombatGroups? etc)
 */
export default class SocialGroup {

	/**
	 * @property {string} name - Name of group.
	 */
	get name() { return this._name; }
	set name(v) { this._name = v; }

	/**
	 * @property {string} leader - group leader.
	 */
	get leader() { return this._leader; }
	set leader(v) { this._leader = v; }

	/**
	 * @property {string[]} roster - Names of characters in the group.
	 */
	get roster() { return this._roster; }
	set roster(v) { this._roster = v; }

	/**
	 * @property {string[]} invites - Active invites to join the group.
	 */
	get invites() { return this._invites; }
	set invites(v) { this._invites = v; }

	private _name?: string;
	private _invites!: string[];
	private _roster!: string[];
	private _leader!: string;

	private readonly _cache: Cache;

	constructor(cache: Cache) {

		this._cache = cache;
	}

	/**
	 * Invite character to group.
	 * @param {Char} char
	 */
	invite(char: Char | string) {

		let name = typeof char === 'string' ? char : char.name;

		if (this._invites.includes(name) || this._roster.includes(name)) return;
		this._invites.push(name);

	}

	/**
	 * Accept character in group. Character was confirmed.
	 * @param {*} char
	 * @returns {boolean}
	 */
	acceptInvite(char: Char) {

		let name = char.name;

		// prevent double join errors, but return success.
		if (this.roster.includes(name)) return true;

		let ind = this.invites.indexOf(name);
		if (ind >= 0) {

			this.invites.splice(ind, 1);
			this.roster.push(name);

			return true;

		} else return false;

	}

	async randChar() {
		return this._cache.fetch(this.roster[Math.floor(this.roster.length * Math.random())]);
	}

	/**
	 *
	 * @param {string} name
	 * @returns true if the party should be removed. false otherwise.
	 */
	leave(char: Char) {

		let name = char.name;
		let ind = this._roster.indexOf(name);
		if (ind >= 0) {

			this._roster.splice(ind, 1);
			if (this._roster.length === 0 ||
				(this._roster.length === 1 && this._invites.length === 0)) return true;

			if (this._leader === name) this._leader = this._roster[0];

		}
		return false;
	}

	/**
	 *
	 * @param {string|Char} char
	 */
	includes(char: Char | string) {
		return this._roster.includes(typeof char === 'string' ? char : char.name);
	}

	isLeader(char: Char | string) { return this._leader === (typeof char === 'string' ? char : char.name); }

	setLeader(char: Char | string) {

		let name = (typeof (char) === 'string') ? char : char.name;
		if (!this.roster.includes(name)) return false

		this.leader = name;
		return true;

	}

	getList() {
		return this._name + ":\n" + this._roster.join('\n');
	}

}