exports.blockText = (s)=> '```' + s + '```';

exports.sendBlock = (m,s)=> m.reply( '```' + s + '```');
/**
 * Checks if the character is a vowel.
 * @param {character} c 
 */
function isVowel( c ) {
	return c === 'a' || c === 'e' || c === 'i' || c === 'o' || c === 'u';
}