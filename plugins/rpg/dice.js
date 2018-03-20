const rollex = /^([\+\-]?\d*)?d(\d*)([\+\-]?\d+)?/;

exports.Roller = class Roller {

	static FromString( str ) {

		let res = rollex.exec( str );
		if ( res === null ) return new Roller();

		let count = parseInt( res[1] );
		if ( Number.isNaN(count ) ) count = 1;

		let sides = parseInt( res[2] );
		if ( Number.isNaN(sides )) sides = 6;

		let bonus = parseInt( res[3] );
		if ( Number.isNaN(bonus)) bonus = 0;

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
		let sign = 1;
		let i = this.count;
	
		if ( i < 0 ) {
			i = -i;
			sign = -1;
		}

		while ( i-- > 0 ) {
			total += Math.floor( s*Math.random() + 1 );
		}

		return sign*total;

	}

}


exports.roll = roll;

exports.parseRoll = function( str ) {

	let res = rollex.exec( str );
	if ( res === null ) return roll(1,6);

	let num = parseInt( res[1] );
	let sides = parseInt( res[2] );	
	let bonus = parseInt( res[3] );

	if ( Number.isNaN(num ) ) num = 1;
	if ( Number.isNaN(sides )) sides = 6;
	if ( Number.isNaN(bonus)) bonus = 0;

	let total = 0;
	let neg;
	if ( num < 0 ) {
		neg = true;
		num = -num;
	}

	while ( num-- > 0 ) {
		total += Math.floor( sides*Math.random() ) + 1;
	}

	return neg ? -total : total;

}

function roll( count, sides, bonus=0 ) {

	let total = bonus;

	let neg;
	if ( count < 0 ) {
		neg = true;
		count = -count;
	}

	while ( count-- > 0 ) {
		total += Math.floor( sides*Math.random() ) + 1;
	}

	return neg ? -total : total;

}
