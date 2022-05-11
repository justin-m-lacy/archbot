type SexType = 'm' | 'f';

type Pronoun =
	// subject
	'sub' |
	// object
	'ob' |
	/// adjectival
	'adj' |
	// possessive
	'pos' |
	/// self-referential
	'ref' |
	/// 'x is' contraction
	'is' |
	'sex' |
	'adult' |
	'child';

type PronounMap = { [Property in Pronoun]: string };
let m: PronounMap = {

	"sub": "he",
	"ob": "him",
	"adj": "his",
	"pos": "his",
	"ref": "himself",
	"is": "he's",
	'sex': 'male',
	'adult': 'man',
	'child': 'boy'

};
let f: PronounMap = {
	"sub": "she",
	"ob": "her",
	"adj": "her",
	"pos": "hers",
	"ref": "herself",
	"is": "she's",
	'sex': 'female',
	'adult': 'woman',
	'child': 'girl'
};

let genders: { [types: string]: PronounMap } = {

	m: m,
	male: m,
	f: f,
	female: f
}

// grammatical replacement indicators.
let genReg = /%sub|%ob|%adj|%pos|%ref|%is/g

/**
 * Re-genders a string with grammatical gender markers: e.g. %sub (subjective)
 * @param {string} gender
 * @param {string} str - string to genderfy
 * @returns {string}
 */
export const genderfy = (gender: string, str: string) => {

	let pronouns = genders[gender.toLowerCase()];
	if (!pronouns) return;

	return str.replace(genReg, (orig) => {

		/// cut '%
		let match = orig.slice(1).toLowerCase();

		if (match in pronouns) {

			/// map pronoun token to actual pronoun.
			let actual = pronouns[match as Pronoun];
			if (!actual) return orig;

			if (orig[0] === orig[0].toUpperCase()) {
				return actual[0].toUpperCase() + actual.slice(1);
			}
			return actual;

		} else {
			return orig;
		}

	});

}

/**
 * TODO:match word case.
 * @param {string} gender
 * @param {*} word
 */
/*exports.toGender = function( gender, word ){

	let o = genders[ gender.toLowerCase() ];
	if ( !o ) return word;

	let g = o[word.toLowerCase()];
	if ( !g ) return word;

	if ( word[0] === word[0].toUpperCase() ) {

		return g.slice(0,1).toUpperCase() + g.slice(1);

	}

	return g;

}*/