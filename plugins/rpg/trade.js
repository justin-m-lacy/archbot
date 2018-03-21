const util = require('../../jsutils.js');

var isGold = /^(\d+)\s*g(?:old)?$/i;

function rollCost(lvl) {
	return 10*lvl*( 1 << Math.floor(lvl/4) );
}

exports.rollWeap = (char ) => {

	let level = char.level;
	if ( !char.payOrFail( rollCost(level) ) )
		return char.name + ' cannot afford to roll a new weapon.'; 

	let gen = require( './items/itemgen.js' );

	level = Math.max( 0, level + util.random( -1, 2 ) );
	let it = gen.genWeapon( level );

	if ( !it) return 'Failed to roll a weapon.';

	char.addItem(it);
	return char.name + ' rolled a shiny new ' + it.name;

}

exports.rollArmor = (char, slot ) => {

	let level = char.level;
	if ( !char.payOrFail( rollCost(level) ) )
		return char.name + ' cannot afford to roll a new weapon.'; 

	let gen = require( './items/itemgen.js' );

	level = Math.max( 0, level + util.random( -1, 2 ) );
	let it = gen.genArmor( slot, level );

	if ( !it) return 'Failed to roll armor.';

	char.addItem(it);

	return char.name + ' rolled a shiny new ' + it.name;

}

exports.sell = (src, wot) => {

	let it = src.takeItem(wot);
	if ( !it ) return 'Item not found.';

	let gold = Number.isNaN(it.cost) ? ( Math.random() < 0.5 ? 1 : 0 ) : it.cost;
	src.addGold( gold );
	return it.name + ' sold for ' + gold + ' gold.';

}

exports.transfer = function transfer( src, dest, what ) {

	let res = isGold.exec( what );
	if ( res !== null ) {

		console.log( 'gold transfer: ' + res[1] );
		return xferGold( src, dest, res[1] );

	} else {

		console.log( 'item transfer: ' + what );
		let it = src.takeItem(what);
		if ( it ) {
			dest.addItem(it);
			return true;
		}
	}

	return "No item called \'" + what + "\' found.";

}

function xferGold( src, dest, count ) {

	if ( typeof(count) === 'string') count = parseInt( count );
	if ( Number.isNaN(count)) return 'Amount is not a number.';

	let gold = src.gold;

	if ( gold < count ) return "Not enough gold.";

	gold -= count;
	src.gold = gold;
	dest.addGold( count );

	return true;

}