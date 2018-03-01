
var isGold = /^(\d+)\s*g(?:old)?$/i;

exports.transfer = function transfer( src, dest, what ) {

	let res = isGold.exec( what );
	if ( res !== null ) {

		console.log( 'attempging gold transfer: ' + res[1] );
		return xferGold( src, dest, res[1] );

	} else {

		console.log( 'attempting item transfer: ' + what );
		let it = src.remove(what);
		if ( it != null ) {
			dest.addItem(it);
			return true;
		}
	}

	return "No item called \'" + what + "\' found.";

}

function xferGold( src, dest, count ) {

	if ( typeof(count) === 'string') {
		count = parseInt( count );
	}
	if ( Number.isNaN(count)) return 'Amount not a number.';

	let gold = src.gold;

	if ( gold < count ) return "Not enough gold.";

	gold -= count;
	src.gold = gold;
	dest.addGold( count );

	return true;

}