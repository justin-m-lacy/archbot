
exports.tryLevel = tryLevel;

function tryLevel( char ) {

	if ( char.exp < getNextExp(char) ) return false;
	char.levelUp();

	return true;

}

function getNextExp( char ) {

	let req = requiredExp( char.level+1);

	let cls = char.charClass;
	if ( cls ) req *= cls.expMod;

	let race = char.race;
	if ( race ) req *= race.expMod;

	return Math.floor( req );

}


function requiredExp( level ) {
	return Math.floor( 100*( Math.pow( 1.5, level) ) );
}

/**
 * 
 * @param {number} curLevel - current char level.
 * @returns {number} exp needed to reach next level.
 */
function nextExp( curLevel ) {
	return Math.floor( 100*( Math.pow( 1.5, ++curLevel) ) );
}