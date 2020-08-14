const ReactModule = require( './reaction');
const parseReaction = ReactModule.parseReaction;
const parseReactions = ReactModule.parseReactions;

/**
 * @const {RegEx} groupRegex - regex for substitution in a regex reaction. $1, $2, etc.
 */
const groupRegex = /\$(\d+|[&'`])/g;

/**
 * Collection of reactions tied to a single Trigger.
 */
class ReactSet {

	toJSON(){
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

	constructor( trig, reacts=null ) {

		this._trigger = trig;

		if ( Array.isArray(reacts)) {

			this._reacts = parseReactions(reacts);

		} else {

			this._reacts = [];

			if ( reacts ){
				let r = parseReaction(reacts);
				if ( r ) this._reacts.push(r);
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
	findReactions( reactStr=null ) {

		if ( reactStr === null || reactStr === undefined ) return this._reacts;

		var obj;

		if ( !isNaN(reactStr) ) {
			obj = this.getNumber( reactStr );
			if ( obj) return obj;

		}

		reactStr = reactStr.toLowerCase();

		for( let i = 0; i < this._reacts.length; i++ ) {
			if ( this._reacts[i].sameReact(reactStr)) return this._reacts[i];
		}

		return null;

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
	tryRemove( react=null ) {

		if ( react === null ) {

			// ambiguous removal. return the number of reactions.
			if ( this._reacts.length > 1 ) return this._reacts.length;

			this._reacts.length = 0;
			return true;

		}

		/**
		 * Attempt to remove a 1-based indexed reaction.
		 * Removal attemp continues on failure because a reaction could be an actual number.
		 * The 'number reaction' isn't tested first since it would allow users
		 * to block indexed-removal by flooding number reactions;
		 * while a 'number reaction' can always be removed by index.
		 */
		if ( !isNaN(react) && this.removeNumber( react ) ) return true;

		for (let i = this._reacts.length - 1; i >= 0; i--) {

			if ( this._reacts[i].sameReact( react ) ) {
				this._reacts.splice( i, 1 );
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
	getNumber( num ) {

		if ( num < 1 || num > this._reacts.length ) return null;

		return this._reacts[num-1];

	}

	/**
	 * Remove a one-based numbered reaction.
	 * @param {number} num - the one-based reaction to remove.
	 * @returns {boolean} true if reaction removed, false otherwise.
	 */
	removeNumber( num ) {

		num = Number(num);
		if ( num < 1 || num > this._reacts.length ) return false;

		this._reacts.splice( num-1, 1 );
		return true;

	}

	/**
	 * Get random reaction.
	 * @returns {Reaction|null}
	 */
	getReact() {
		return this._reacts[ Math.floor( this._reacts.length*Math.random())];
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
	add( react, uid, embedUrl=null ) {
		this._reacts.push( new ReactModule.Reaction( react, uid, Date.now(), embedUrl ) );
	}

}

module.exports = ReactSet;