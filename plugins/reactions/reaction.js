/**
 *
 * @param {string} resp
 * @param {string} uid - userid of creator
 * @param {?string} embed - url of embedded attachment
 */
export const makeReaction = ( resp, uid, embed ) => {
	return new Reaction( resp, uid, Date.now(), embed );
}

export class Reaction {

	/*toJSON(){



	}*/

	constructor( response, uid, t=0, embed=undefined ){

		/**
		 * @property {string} response - reaction response.
		 */
		this.r = response;

		/**
		 * @property {string} uid - uid of reaction creator
		 */
		this.uid = uid;

		/**
		 * @property {number} t - timestamp of reaction creation time.
		 */
		this.t = t;

		/**
		 * @property {string} embed - url of reaction embed.
		 */
		this.embed = embed;

	}

	/**
	 * Test if a response string matches this reaction.
	 * @param {string} str
	 * @returns {bool} Whether the react object matches the string.
	 */
	sameReact( str ) {

		return this.r === str;

	}

	/**
	 * Get the text portion of the reaction response.

	 *
	 * @param {string|RegExp} trig - trigger that matched input string.
	 * @param {string} str - input string that triggered reaction.
	 * @returns {string}
	 */
	getResponse( trig, str ) {

		if ( typeof trig === 'string' ) return this.r;

		return trig.global ?
			this.fullReplace( trig, str ) :
			this.groupReplace( trig, str );

	}

	/**
	 * @returns {string} - Raw reaction display string, with no substitions applied.
	 */
	toString(){
		return this.r;
	}

	/**
	 * Substitute regex groups in the reaction text.
	 * Groups are 1-based placeholders in the form of "$n"
	 * @param {RegExp} trig
	 * @param {string} text
	 */
	groupReplace( trig, text ) {

		var res, resLen;
		let resp = this.r;

		trig.lastIndex = 0;	// reset from test()

		// TODO: Global option?
		if ( ( res = trig.exec(text)) !== null ) {

			resLen = res.length;
			// replace $ groups.
			resp = resp.replace( groupRegex, ( match, p1, )=> {

				let n = Number( p1 );
				if ( Number.isNaN(n) === true ) {

					if ( p1 === '`') return text.slice(0, res.index );
					else if ( p1 === "'") return text.slice( trig.lastIndex );	// TODO: Wrong.
					else if ( p1 === '&') return res[0];

				} else if ( n < resLen ) return res[n];

				return match;

			});

		}

		return resp;

	}

	/**
	 * Get reaction text replacing each section of input that matches the RegEx trigger with the full response.
	 * @note A RegExp with the global flag replaces each section of the input that matches
	 * the regex with the full response string.
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace
	 */
	fullReplace( trig, text ) {
		return text.replace( trig, this.r );
	}

}

/**
 *
 * @param {?object|string} r
 * @returns {Reaction|null}
 */
export const parseReaction = ( r ) => {


	if ( typeof r === 'object') {

		if ( r instanceof Reaction ) {
			return r;
		} else {

			return new Reaction( r.r, r.uid, r.t, r.embed );
		}

	} else if ( typeof r === 'string' ) return new Reaction(r);

	return null;

}

/**
 * Parse an array of reactions.
 * @param {Array} a
 * @returns {Reaction[]}
 */
export const parseReactions = (a) => {

	let d = [];

	let len = a.length;
	for( let i = 0; i < len; i++ ) {

		let r = parseReaction(a[i]);
		if ( r !== null ) d.push(r);
	}

	return d;

}