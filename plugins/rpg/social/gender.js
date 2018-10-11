
let m = {

	"sub":"he",
	"ob":"him",
	"adj":"his",
	"pos":"his",
	"ref":"himself",
	"is":"he's"

},
f ={
	"sub":"she",
	"ob":"her",
	"adj":"her",
	"pos":"hers",
	"ref":"herself",
	"is":"she's"
};

let genders = { 

	m:m,
	male:m,
	f:f,
	female:f
}

let genReg = /%sub|%ob|%adj|%pos|%ref|%is/g

/**
 * Re-genders a string marked with pronoun cases: e.g. %sub (subjective)
 * @param {string} gender 
 * @param {*} str 
 */
exports.genderfy = function( gender, str ) {

	let g = genders[gender.toLowerCase()];
	if ( !g ) return;

	return str.replace( genReg, function(match){

		match = match.slice(1);	// cut '%'
		let s = g[match.toLowerCase()];
		if ( !s ) return match;

		if ( match[0] === match[0].toUpperCase() ) {
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