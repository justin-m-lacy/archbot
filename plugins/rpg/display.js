exports.blockText = (s)=> '```' + s + '```';

exports.sendEmbed = (m,s,e)=> m.reply( '```' + s + '```', {embed:{image:{url:e}}});

exports.sendBlock = (m,s)=> m.reply( '```' + s + '```');
/**
 * Checks if the character is a vowel.
 * @param {character} c 
 */
exports.isVowel = function( c ) {
	return c === 'a' || c === 'e' || c === 'i' || c === 'o' || c === 'u';
}

exports.echoChar =function( chan, char, prefix = '' ) {
	
	let namestr = char.name + ' is a';
	let desc = char.getLongDesc();
	chan.send( prefix + '```' + namestr + ( exports.isVowel(desc.charAt(0) )?'n ':' ') + desc + '```' );

}