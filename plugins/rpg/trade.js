
exports.transfer = function transfer( src, dest, args ) {

	if ( args.length == 2 ) {

		if ( args[1] === 'gold') {
			return xferGold( src, dest, args[0] );
		}

	}
	return "Not sure what you want to transfer.";

}

function xferGold( src, dest, count ) {

	if ( typeof(count) === 'string ') count = parseInt( count );
	if ( isNaN(count)) return 'Amount not a number.';

	let gold = src.gold;
	if ( gold < count ) return "Not enough gold.";

	gold -= count;
	src.gold = gold;
	dest.addGold( count );

	return true;

}