
exports.Roller = class Roller {

	static FromString( str ) {

		if ( str == null ) return new Roller();

		let ind = str.indexOf( '+' );
		if ( ind >= 0 ) {

			let bonus = parseInt( str.slice(ind+1) );
			if ( !isNaN(bonus)) bonus = 0;
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
		return new Roller( num, sides, bonus );

	}

	static FromJSON( json ) {
		return new Roller( json.count, json.sides, json.bonus );
	}

	toJSON() {
		return { sides:this._sides, count:this._count, bonus:this._bonus };
	}

	constructor( count=1, sides=6, bonus=0 ) {

		this._sides = sides;
		this._count = count;
		this._bonus = bonus;

	}

	roll() {

		let total = 0;
		let s = this._sides;
		for( let i = this._count; i > 0; i-- ) {
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

function roll( count, sides, bonus=0 ) {

	let total = bonus;
	while ( count-- > 0 ) {
		total += Math.floor( sides*Math.random() ) + 1;
	}

	return total;

}
