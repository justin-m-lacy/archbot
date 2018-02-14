exports.roll = roll;


function roll( count, sides, bonus=0 ) {

	let total = bonus;
	while ( count-- > 0 ) {
		total += Math.floor( sides*Math.random() ) + 1;
	}

	return total;

}


exports.parseRoll = ( str ) => {

	if ( str == null || str === '' ) return roll( 1, 6);

	let total = 0;
	let ind = str.indexOf( '+' );
	if ( ind >= 0 ) {

		let bonus = parseInt( str.slice(ind+1) );
		if ( !isNaN(bonus)) total = bonus;
		str = str.slice(0, ind);
	}

	let num, sides;
	ind = str.indexOf( 'd' );
	if ( ind < 0 ) {

		num = 1;
		sides = parseInt(str);

	} else {

		num = parseInt( str.slice(0,ind) );
		if ( isNaN(num)) num = 1;
		sides = parseInt( str.slice( ind+1 ) );

	}

	if ( isNaN(sides)) sides = 6;

	while ( num-- > 0 ) {
		total += Math.floor( sides*Math.random() ) + 1;
	}

	return total;

}