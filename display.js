module.exports = {

	capsRegEx:/(?:\b(\w*)\b)*/g,

	blockText:(s)=> '```' + s + '```',

	sendEmbed:async (m,s,e)=> m.reply( '```' + s + '```', {embed:{image:{url:e}}}),

	sendBlock:async (m,s)=> m.reply( '```' + s + '```'),

	/**
 	* Checks if the character is a vowel.
 	* @param {string} c - character to test. 
 	*/
	isVowel:( c ) => {

		c = c.toLowerCase();
		return c === 'a' || c === 'e' || c === 'i' || c === 'o' || c === 'u';

	},

	/**
	 * 
	 * @param {string} str
	 * @returns {string}
	 */
	capitalize( str ){

		return str.replace( this.capsRegEx, ( sub )=>{
			return sub[0].toUpperCase() + sub.slice(1);
		});

	}


}