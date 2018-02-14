exports.Roller = class {

	static roll( dice ) {

		let ind = dice.indexOf( 'd' );
		let num, sides;

		if ( ind < 0 ) {

			num = 1;
			sides = parseInt(dice);

		} else {

			num = parseInt( dice.slice(0,ind) );
			if ( isNaN(num)) num = 1;
			sides = parseInt( dice.slice( ind+1 ) );

		}

		if ( isNaN(sides)) sides = 6;

		let total = 0;
		while ( num-- > 0 ) {
			total += Math.floor( sides*Math.random() ) + 1;
		}

		return total;

	}

}