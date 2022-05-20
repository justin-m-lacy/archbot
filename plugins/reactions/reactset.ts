import { Reaction, parseReaction, parseReactions, ReactionData } from './reaction';

/**
 * Collection of reactions tied to a single Trigger.
 */
export class ReactSet {

	private _reacts: Reaction[];

	private _trigger: string | RegExp;

	private _lastUsed: number = 0;

	toJSON() {
		return this._reacts;
	}

	/**
	 * @property {string|RegExp} trigger - reaction trigger.
	 */
	get trigger() { return this._trigger; }
	set trigger(v) { this._trigger = v; }

	/**
	 * @property {Reaction[]} reacts
	 */
	get reacts() { return this._reacts; }
	set reacts(v) { this._reacts = v; }

	/**
	 * @property {number} lastUsed - timestamp when trigger was last used
	 * for a reaction.
	 */
	get lastUsed() { return this._lastUsed; }
	set lastUsed(v) { this._lastUsed = v; }

	constructor(trig: string | RegExp, reacts?: (Reaction | ReactionData)[]) {

		this._trigger = trig;

		if (Array.isArray(reacts)) {

			this._reacts = parseReactions(reacts);

		} else {

			this._reacts = [];

			if (reacts) {
				let r = parseReaction(reacts);
				if (r) this._reacts.push(r);
			}
		}

	}

	/**
	 *
	 * @param {string|Number|null} [reactStr=null] - React string to match, or null if
	 * all reactions should be returned.
	 * @returns {Reaction|Array|null} - String or Object information matched,
	 * or Array of all Reactions of reactStr is null, or false if no reaction
	 * matching the string is found.
	 */
	findReactions(reactStr?: string | number | null) {

		if (reactStr === null || reactStr === undefined) return this._reacts;

		if (typeof reactStr === 'string') {

			if (Number.isNaN(reactStr)) {
				reactStr = reactStr.toLowerCase();

				for (let i = 0; i < this._reacts.length; i++) {
					if (this._reacts[i].sameReact(reactStr)) return this._reacts[i];
				}
				return null;
			}

		}

		return this.getNumber(typeof reactStr === 'string' ? parseInt(reactStr) : reactStr);

	}

	/**
	 *
	 * @param {string|RegEx} react - reaction to remove, or null to remove a single reaction,
	 * if only one reaction exists.
	 * @returns {number|boolean} If no matching reaction is found, returns false.
	 * If a reaction is removed, returns true.
	 * If no match term is specified, and multiple reactions exist, returns the
	 * number of reactions found.
	 */
	tryRemove(react?: string | null) {

		if (react === null || react === undefined) {

			// ambiguous removal. return the number of reactions.
			if (this._reacts.length > 1) return this._reacts.length;

			this._reacts.length = 0;
			return true;

		}

		/**
		 * Attempt to remove a 1-based indexed reaction.
		 * NOTE!! Removal attemp continues on failure because a reaction could be an actual number.
		 * The 'number reaction' isn't tested first since it would allow users
		 * to block indexed-removal by flooding number reactions;
		 * while a 'number reaction' can always be removed by index.
		 */
		if (!Number.isNaN(react) && this.removeNumber(parseInt(react))) return true;

		for (let i = this._reacts.length - 1; i >= 0; i--) {

			if (this._reacts[i].sameReact(react)) {
				this._reacts.splice(i, 1);
				return true;
			}

		}
		return false;

	}

	/**
	 * Returned one-based numbered reaction.
	 * @param {number} num - The ONE-based index of the reaction.
	 * @returns {Object|null}
	 */
	getNumber(num: number) {

		if (num < 1 || num > this._reacts.length) return null;

		return this._reacts[num - 1];

	}

	/**
	 * Remove a one-based numbered reaction.
	 * @param {number} num - the one-based reaction to remove.
	 * @returns {boolean} true if reaction removed, false otherwise.
	 */
	removeNumber(num: number) {

		num = Number(num);
		if (num < 1 || num > this._reacts.length) return false;

		this._reacts.splice(num - 1, 1);
		return true;

	}

	/**
	 * Get random reaction.
	 * @returns {Reaction|null}
	 */
	getRandom() {
		if (this._reacts.length > 0) {
			return this._reacts[Math.floor(this._reacts.length * Math.random())];
		}
		return null;
	}

	/**
	 * @returns {boolean}
	 */
	isEmpty() {
		return this._reacts.length <= 0;
	}

	/**
	 *
	 * @param {string} react - reaction string.
	 * @param {string} uid - disord user snowflake.
	 * @param {string} [embedUrl=null] - url of attachment or embed to include in reaction.
	 */
	add(react: string, uid: string, embedUrl?: string | null) {
		this._reacts.push(new Reaction(react, uid, Date.now(), embedUrl));
	}

}