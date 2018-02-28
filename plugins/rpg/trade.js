
exports.transfer = function transfer( src, dest, args ) {

	let len = args.length;
	if ( len === 1 ) {

		let arg = args[0];
		let ind = arg.indexOf( 'g');
		if ( ind == arg.length-1 ) {

			// give t xg
			let g = parseInt( arg.slice(0, ind) );
			if ( !isNaN(g)) return xferGold( src, dest, g );

		}

	} else if ( len == 2 ) {

		if ( args[1] === 'gold') {
			return xferGold( src, dest, args[0] );
		}

	}
	return "Not sure what you want to transfer.";

}

function xferGold( src, dest, count ) {

	if ( typeof(count) === 'string') {
		count = parseInt( count );
	}
	if ( isNaN(count)) return 'Amount not a number.';

	let gold = src.gold;

	if ( gold < count ) return "Not enough gold.";

	gold -= count;
	src.gold = gold;
	dest.addGold( count );

	return true;

}