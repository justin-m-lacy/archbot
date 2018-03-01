
exports.Roller = class Roller {

	static FromString( str ) {

		let num, sides, bonus;

		if ( str == null ) return new Roller();

		let ind = str.indexOf( '+' );
		if ( ind >= 0 ) {

			bonus = parseInt( str.slice(ind+1) );
			if ( Number.isNaN(bonus)) bonus = 0;
			str = str.slice(0, ind);
		}


		ind = str.indexOf( 'd' );
		if ( ind < 0 ) {

			num = 1;
			sides = parseInt(str);

		} else {

			num = parseInt( str.slice(0,ind) );
			if ( Number.isNaN(num)) num = 1;
			sides = parseInt( str.slice( ind+1 ) );

		}

		if ( Number.isNaN(sides)) sides = 6;
		return new Roller( num, sides, bonus );

	}

	static FromJSON( json ) {
		return Object.assign( new Roller(), json );
	}

	constructor( count=1, sides=6, bonus=0 ) {

		this.sides = sides;
		this.count = count;
		this.bonus = bonus;

	}

	toString() {
		return this.bonus ? this.count + 'd' + this.sides + '+' + this.bonus : this.count + 'd' + this.sides;
	}

	roll() {

		let total = 0;
		let s = this.sides;
		for( let i = this.count; i > 0; i-- ) {
			total += Math.floor( s*Math.random() + 1 );
		}
		return total;

	}

}


exports.roll = roll;

exports.parseRoll = function( str ) {

	if ( str == null ) return roll( 1, 6);

	let total = 0;
	let ind = str.indexOf( '+' );
	if ( ind >= 0 ) {

		let bonus = parseInt( str.slice(ind+1) );
		if ( !Number.isNaN(bonus)) total = bonus;
		str = str.slice(0, ind);
	}

	let num, sides;
	ind = str.indexOf( 'd' );
	if ( ind < 0 ) {

		num = 1;
		sides = parseInt(str);

	} else {

		num = parseInt( str.slice(0,ind) );
		if ( Number.isNaN(num)) num = 1;
		sides = parseInt( str.slice( ind+1 ) );

	}

	if ( Number.isNaN(sides)) sides = 6;

	while ( num-- > 0 ) {
		total += Math.floor( sides*Math.random() ) + 1;
	}

	return total;

}

function roll( count, sides, bonus=0 ) {

	let total = bonus;
	while ( count-- > 0 ) {
		total += Math.floor( sides*Math.random() ) + 1;
	}

	return total;

}
