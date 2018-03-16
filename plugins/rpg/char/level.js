
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

	return level*( 1 << (Math.floor(level/2)) )*75;

}

/**
 * 
 * @param {number} curLevel - current char level.
 * @returns {number} exp needed to reach next level.
 */
function nextExp( curLevel ) {
	curLevel++;
	return (curLevel)*( 1 << (Math.floor(curLevel/2)) )*75;
}