exports.blockText = (s)=> '```' + s + '```';

exports.sendEmbed = async (m,s,e)=> m.reply( '```' + s + '```', {embed:{image:{url:e}}});

exports.sendBlock = async (m,s)=> m.reply( '```' + s + '```');

/**
 * Checks if the character is a vowel.
 * @param {string} c - character to test. 
 */
exports.isVowel = ( c ) => {

	c = c.toLowerCase();
	return c === 'a' || c === 'e' || c === 'i' || c === 'o' || c === 'u';
}

exports.echoChar = async function( chan, char, prefix = '' ) {
	
	let namestr = char.name + ' is a';
	let desc = char.getLongDesc();
	return chan.send( prefix + '```' + namestr + ( exports.isVowel(desc.charAt(0) )?'n ':' ') + desc + '```' );

}


exports.Log = class Log {

	get text(){ return this._text; }
	get text(v) { this._text = v; }

	constructor() {
		this._text = '';
	}

	/**
	 * Gets and clears the current log text.
	 * @returns {string} The current log text.
	 */
	getAndClear() {
		let t = this._text;
		this._text = '';
		return t;
	}

	log( str) { this._text += str +'\n'; }
	output( str='') { return this._text + str; }
	clear() { this._text = ''; }

}