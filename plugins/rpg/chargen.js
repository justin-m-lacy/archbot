const Char = require( './char/char.js');
const stats = require( './char/stats.js');

const Race = exports.Race = require( './race.js');
const CharClass = exports.CharClass = require( './charclass.js' );
const Dice = require( './dice.js');
const ItemGen = require( './items/itemgen.js' );

// base generation rolls.
var stat_rolls = {

	// base stat rolls
	base:[
		{ stat:['str','dex','con','wis','int','cha'], rolls:3, die:6, mod:0, minVal:3}
	],

	// info rolls
	info:[
		{ stat:'sex', set:['f','m'] },
		{ stat:'gold', rolls:3, die:4, mod:1 }
	]

};

exports.boundStats = boundStats;
exports.genChar = function( owner, race, charClass, name, sex ) {

	console.log( 'generating character...');

	let char = new Char( race, charClass, owner );
	char.name = name;

	let info = rollStats( stat_rolls.info, {} );
	modStats( race.infoMods, info );
	modStats( charClass.infoMods, info );
	char.info = info;

	let base = rollStats( stat_rolls.base, new stats.StatBlock() );

	console.log( 'hit: ' + race.HD + '  class: ' + charClass.HD );
	base.curHp = base.maxHp = char.HD;

	char.setBaseStats( base );

	boundStats(char);

	initItems( char );

	return char;

}

function modStats( statMods, destObj ) {

	let cur, mod;
	for( let stat in statMods ) {

		cur = destObj[stat];

		if ( typeof(statMods[stat]) === 'string' ) {
			mod = Dice.parseRoll( statMods[stat]);

		} else {
			mod = statMods[stat];
		}

		if ( cur == null ) destObj[stat] = mod;
		else destObj[stat] = cur + mod;

	}

}

function rollStats( statRolls, destObj ) {

	let rollInfo;
	let stat;
	for( let i = statRolls.length-1; i >= 0; i-- ) {

		rollInfo = statRolls[i];
		stat = rollInfo.stat;
		if ( Array.isArray( stat) ) {

			for( let j = stat.length-1; j >= 0; j-- ) {
				rollStat( destObj, stat[j], rollInfo );
			}

		} else {

			rollStat( destObj, stat, rollInfo )

		}


	}
	return destObj;

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

function rollStat( destObj, stat, info ) {

	if ( info.set != null ) {
		// choose from set.
		if ( destObj.hasOwnProperty(stat) ) return;	// already set.
		console.log( 'setting \'set\' property: ' + stat );
		destObj[stat] = info.set[ Math.floor( info.set.length*Math.random() )];

	} else {
		destObj[stat] = Dice.roll( info.rolls, info.die, info.mod );
	}

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

		if ( Array.isArray( stat ) ) {

			for( let j = stat.length-1; j >= 0; j-- ) {
				boundStat( char, stat[j], info );
			}

		} else {

			boundStat( char, stat, info )

		}

	}

}

function initItems( char ) {

	let count = Math.floor( 1+ 3*Math.random() );

	for( count; count >= 0; count-- ) {
		char.addItem( ItemGen.miscItem() );
	}
	char.addItem( ItemGen.genWeapon(1), ItemGen.genArmor(null,1));

}