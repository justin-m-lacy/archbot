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
	 * @property {string|RegeEx} trigger - trigger in message text that triggers
	 * one of the set reactions.
	 */
	get trigger() { return this._trigger; }
	set trigger(v) { this._trigger = v; }

	/**
	 * @property {Reaction[]} reacts
	 */
	get reacts() { return this._reacts; }
	set reacts(v) { this._reacts = v; }

	/**
	 * @property {number} lastUsed - timestamp of when trigger was last used
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
	 * @returns {false|string|Object|Array} - String or Object information matched,
	 * or Array of all Reactions of reactStr is null, or false if no reaction
	 * matching the string is found.
	 */
	findReactions( reactStr=null ) {

		if ( reactStr === null || reactStr === undefined ) return this._reacts;

		var obj;

		if ( !isNaN(reactStr) ) {
			obj = this.getIndex( reactStr - 1 );
			if ( obj) return obj;

		}

		reactStr = reactStr.toLowerCase();

		obj = this._reacts;
		if ( typeof obj === 'string') {

			if ( reactStr === obj.toLowerCase() ) return obj;

		} else if ( obj instanceof Array ) {

			return obj.find( (elm)=>{
				if ( typeof elm === 'string') return elm.toLowerCase() === reactStr;
				else return ( typeof elm.r === 'string' && elm.r.toLowerCase() === reactStr );
			});

		} else if ( typeof obj.r === 'string' && obj.r.toLowerCase() === reactStr ) return obj;

		return false;

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

			this._reacts = null;
			return true;

		}

		/**
		 * Attempt to remove a numbered reaction.
		 * Removal attemp continues on failure because a reaction could actually be a number.
		 * The literaly reaction-is-number isn't tested first since it would allow users
		 * to thwart numbered-removal by flooding number reactions.
		 */
		if ( !isNaN(react) && this.removeIndex(react-1) ) return true;

		for (let i = this._reacts.length - 1; i >= 0; i--) {

			if (this._isMatch(react, this._reacts[i]) === true) {
				this._splice(this._reacts, i);
				return true;
			}

		}
		return false;

	}

	/**
	 * Returns a reaction based on index or null for invalid index.
	 * @param {number} ind - The zero-based index of the reaction.
	 * @returns {Object|null}
	 */
	getIndex( ind ) {

		if ( ind < 0 || ind >= this._reacts.length ) return null;

		return this._reacts[ind];

	}

	/**
	 * Remove an indexed reaction.
	 * @param {number} index - the index to remove.
	 * @returns {boolean} true if reaction removed, false otherwise.
	 */
	removeIndex( ind ) {

		ind = Number(ind);
		if ( ind < 0 || ind >= this._reacts.length ) return false;

		this._reacts.splice( ind, 1 );
		return true;

	}

	/**
	 * @returns {string|Object} A reaction string from the set, or a reaction Object with included embed url.
	 */
	getReact() {

		let resp = this._reacts[ Math.floor( this._reacts.length*Math.random())];

		if ( resp instanceof Object ) {

			// return full response Object so embed can be included in result.
			if ( resp.embed ) return resp;
			else resp = resp.r;

		}

		// should be string now.
		if ( typeof resp !== 'string') return resp.toString();
		return resp;

	}

	/**
	 * Substitute regex groups in the reaction text.
	 * Groups are 1-based placeholders in the form of "$n"
	 * @param {string} text
	 */
	replaceReact( text ) {

		var res, resLen;
		let resp = this.getReact();		// react template.

		this._trigger.lastIndex = 0;	// reset from test()

		// TODO: Global option?
		if ( ( res = this._trigger.exec(text)) !== null ) {

			resLen = res.length;
			// replace $ stubs.
			resp = resp.replace( groupRegex, function( match, p1, ){

				let n = Number( p1 );
				if ( Number.isNaN(n) === true ) {

					if ( p1 === '`') return text.slice(0, res.index );
					else if ( p1 === "'") return text.slice( this._trigger.lastIndex );	// TODO: Wrong.
					else if ( p1 === '&') return res[0];

				} else if ( n < resLen ) return res[n];

				return match;

			});

		}

		return resp;

	}

	/**
	 * Get a regex reaction, using substring matches for replacements in text.
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace
	 */
	textReplace( text ) {
		return text.replace( this._trigger, this.getReact() );
	}

	/**
	 * returns {boolean}
	 */
	isEmpty() {
		return this._reacts === null ||
		((this._reacts instanceof Array ) && this._reacts.length === 0);
	}

	/**
	 *
	 * @param {string} react - reaction string.
	 * @param {string} uid - disord user snowflake.
	 * @param {string} [embedUrl=null] - url of attachment or embed to include in reaction.
	 */
	add( react, uid, embedUrl=null ) {

		//react = { r:react, uid:uid, t:Date.now(), embed:embedUrl };

		this._reacts.push( new ReactModule( react, uid, Date.now(), embedUrl ) );

	}

	_splice( a, i ) {

		if ( i === a.length-1 ) a.pop();
		else a[i] = a.pop();

	}

	/**
	 * Tests whether the react string matches the Reaction.
	 * @param {string|RegEx} str
	 * @param {string|RegEx|Object} react
	 * @returns {bool} Whether the react object matches the string.
	 */
	_isMatch( str, react ) {

		if ( typeof react === 'string' ) return str === react;
		if ( react instanceof Object ) {
			return react.r === str;
		}

		return false;

	}

}

module.exports = ReactSet;