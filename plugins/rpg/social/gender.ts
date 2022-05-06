type Gender = {
	// subject
	'sub': string,
	// object
	'ob': string,
	/// adjectival
	'adj': string,
	// possessive
	'pos': string,
	/// self-referential
	'ref': string,
	/// 'x is' contraction
	'is': string,
	'sex': string,
	'adult': string,
	'child': string
}

let m: Gender = {

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
let f: Gender = {
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

let genders: { [types: string]: Gender } = {

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
const genderfy = (gender: string, str: string) => {

	let g = genders[gender.toLowerCase()];
	if (!g) return;

	return str.replace(genReg, (match) => {

		/// cut '%
		match = match.slice(1).toLowerCase() as keyof Gender;
		let s = g[match];
		if (!s) return match;

		if (match[0] === match[0].toUpperCase()) {
			return s[0].toUpperCase() + s.slice(1);
		}
		return s;

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