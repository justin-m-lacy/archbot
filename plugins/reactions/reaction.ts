export type ReactionData = { r: string, uid?: string, t?: number, embed?: string };


/**
 * @const {RegEx} groupRegex - regex for substitution in a regex reaction. $1, $2, etc.
 */
const groupRegex = /\$(\d+|[&'`])/g;

export class Reaction {

	r: string;
	uid?: string;
	t: number;
	embed?: string | null;

	/**
	 *
	 * @param {string} response
	 * @param {string} uid - response creator
	 * @param {number} t - creation timestamp.
	 * @param {string} embed - embed url.
	 */
	constructor(response: string, uid?: string, t: number = 0, embed?: string | null) {

		/**
		 * @property {string} response - reaction response.
		 */
		this.r = response;

		/**
		 * @property {string} uid - uid of reaction creator
		 */
		this.uid = uid;

		/**
		 * @property {number} t - creation timestamp.
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
	sameReact(str: string) {

		return this.r === str;

	}

	/**
	 * Get the text portion of the reaction response.

	 *
	 * @param {string|RegExp} trig - trigger that matched input string.
	 * @param {string} str - input string that triggered reaction.
	 * @returns {string}
	 */
	getResponse(trig: string | RegExp, str: string) {

		if (typeof trig === 'string') return this.r;

		return trig.global ?
			this.fullReplace(trig, str) :
			this.groupReplace(trig, str);

	}

	/**
	 * @returns {string} - Raw reaction display string, with no substitions applied.
	 */
	toString() {
		return this.r;
	}

	/**
	 * Substitute regex groups in the reaction text.
	 * Groups are 1-based placeholders in the form of "$n"
	 * @param {RegExp} trig
	 * @param {string} text
	 */
	groupReplace(trig: RegExp, text: string) {

		let res: RegExpExecArray | null, resLen: number;
		let resp = this.r;

		trig.lastIndex = 0;	// reset from test()

		// TODO: Global option?
		if ((res = trig.exec(text)) !== null) {

			resLen = res.length;
			// replace $ groups.
			resp = resp.replace(groupRegex, (match, p1,) => {

				const n = Number(p1);
				if (Number.isNaN(n) === true) {

					if (p1 === '`') return text.slice(0, res!.index);
					else if (p1 === "'") return text.slice(trig.lastIndex);	// TODO: Wrong.
					else if (p1 === '&') return res![0];

				} else if (n < resLen) return res![n];

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
	fullReplace(trig: RegExp, text: string) {
		return text.replace(trig, this.r);
	}

}

/**
 *
 * @param {?object|string} r
 * @returns {Reaction|null}
 */
export const parseReaction = (r: Reaction | ReactionData | string) => {

	if (typeof r === 'object') {

		if (r instanceof Reaction) {
			return r;
		} else {

			return new Reaction(r.r, r.uid, r.t, r.embed);
		}

	} else if (typeof r === 'string') return new Reaction(r);

	return null;

}

/**
 * Parse an array of reactions.
 * @param {Array} a
 * @returns {Reaction[]}
 */
export const parseReactions = (a: (Reaction | ReactionData)[]) => {

	const d:Reaction[] = [];

	const len = a.length;
	for (let i = 0; i < len; i++) {

		const r = parseReaction(a[i]);
		if (r != null) d.push(r);
	}

	return d;

}