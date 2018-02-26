const Char = require( './char.js');
const Race = exports.Race = require( './race.js');
const CharClass = exports.CharClass = require( './charclass.js' );
const Dice = require( './dice.js');
const rpg = require( './rpg.js');

// base generation rolls.
var stat_rolls = [

	{ stat:['str','dex','con','wis','int','cha'], rolls:3, die:6, mod:0, minVal:3},
	{ stat:'gold', rolls:3, die:4, mod:1 },
	{ stat:'sex', set:['f','m'] }

];

exports.boundStats = boundStats;
exports.genChar = function( owner, race, charClass, name, sex ) {

	console.log( 'generating character...');

	let char = new Char( owner );

	char.race = race;
	char.charClass = charClass;

	char.applyMods( race.createMods );
	char.applyMods( charClass.createMods );

	let base = rollStats();
	base.hp = ( race.hitdice + charClass.hitdice )/2;

	char.setBaseStats( base );

	boundStats(char);

	if ( sex == null ) sex = Math.random() < 0.5 ? 'm' : 'f';
	if ( name == null ) {
		const namegen = require( './namegen.js' );
		namegen.genName( race, sex );
	}

	return char;

}

/**
 * Bound stats by stat definitions min/max.
 * @param {Char} char 
 */
function boundStats( char ) {

	let info;
	let stat;

	for( let i = stat_rolls.length-1; i >= 0; i-- ) {

		info = stat_rolls[i];
		if ( info.minVal == null && info.maxVal == null ) continue;

		stat = info.stat;
		if ( stat instanceof Array ) {

			for( let j = stat.length-1; j >= 0; j-- ) {
				boundStat( char, stat[j], info );
			}

		} else {

			boundStat( char, stat, info )

		}

	}

}

function rollStats() {

	let baseStats = {};

	let info;
	let stat;
	for( let i = stat_rolls.length-1; i >= 0; i-- ) {

		info = stat_rolls[i];
		stat = info.stat;
		if ( stat instanceof Array ) {

			for( let j = stat.length-1; j >= 0; j-- ) {
				rollStat( baseStats, stat[j], info );
			}

		} else {

			rollStat( baseStats, stat, info )

		}


	}

}

function boundStat( dest, stat, info ) {

	let cur = dest[stat];
	if ( cur == null ) return;

	if ( info.minVal != null && cur < info.minVal ) {
		dest[stat] = info.minVal;
	} else if ( info.maxVal != null && cur > info.maxVal ) {
		dest[stat] = info.maxVal;
	}

}

function rollStat( baseStats, stat, info ) {

	if ( info.set != null ) {
		// choose from set.
		baseStats[stat] = info.set[ Math.floor( set.length*Math.random() )];

	} else {
		baseStats[stat] = Dice.roll( info.rolls, info.die, info.mod );
	}

}