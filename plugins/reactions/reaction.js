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

	toString(){
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