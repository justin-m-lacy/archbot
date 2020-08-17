const requiredExp = ( level ) => {
	return Math.floor( 100*( Math.pow( 1.5, level) ) );
}

const getNextExp = exports.nextExp = ( char ) => {

	let req = requiredExp( char.level+1);

	let cls = char.charClass;
	if ( cls ) req *= cls.expMod;

	let race = char.race;
	if ( race ) req *= race.expMod;

	return Math.floor( req );

}


exports.tryLevel = ( char ) => {

	if ( char.exp < getNextExp(char) ) return false;
	char.levelUp();

	return true;

};
