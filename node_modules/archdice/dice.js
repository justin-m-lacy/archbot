const rollex = /^([\+\-]?\d*)?d(\d*)([\+\-]?\d+)?/;

exports.roll = roll;

/**
 * Represents a roller object of the form (n)d(s) + b
 */
exports.Roller = class Roller {

	static FromString( str ) {

		//console.log('roller from: ' + str );

		let res = rollex.exec( str );
		if ( res === null ) return new Roller();

		let num = parseInt( res[1] );
		let sides = parseInt( res[2] );
		let bonus = parseInt( res[3] );

		if ( Number.isNaN(num ) ) num = 1;
		if ( Number.isNaN(sides )) sides = 6;
		if ( Number.isNaN(bonus)) bonus = 0;

		return new Roller( num, sides, bonus );

	}

	static FromJSON( json ) {

		if ( typeof(json) === 'string') return Roller.FromString(json);
		return Object.assign( new Roller(), json );
	}

	constructor( count=1, sides=0, bonus=0 ) {

		this.sides = sides;
		this.count = count;
		this.bonus = bonus;

	}

	toString() {
		return this.bonus ? this.count + 'd' + this.sides + '+' + this.bonus : this.count + 'd' + this.sides;
	}

	roll() {

		let tot = this.bonus, s = this.sides;
		let i = this.count;
	
		if ( i >= 0 ) {

			while ( i-- > 0 ) tot += Math.floor( s*Math.random() + 1 );
			return tot;
		} else {

			while ( i++ < 0 ) tot += Math.floor( s*Math.random() + 1 );
			return -tot;
		}

	}

}

/**
 * Parses a dice roll string and returns the dice roll result.
 * @param {string} str 
 */
exports.parseRoll = str => {

	let res = rollex.exec( str );
	if ( res === null ) return roll(1,6);

	let num = parseInt( res[1] );
	let sides = parseInt( res[2] );	
	let bonus = parseInt( res[3] );

	if ( Number.isNaN(num ) ) num = 1;
	if ( Number.isNaN(sides )) sides = 6;
	if ( Number.isNaN(bonus)) bonus = 0;

	let tot = bonus;

	if ( num >= 0 ) {

		while ( num-- > 0 ) tot += Math.floor( sides*Math.random() ) + 1;
		return tot;

	} else {

		while ( num++ < 0 ) tot += Math.floor( sides*Math.random() ) + 1;
		return -tot;

	}

}

function roll( count, sides, bonus=0 ) {

	let tot = bonus;

	if ( count >= 0 ) {

		while ( count-- > 0 ) tot += Math.floor( sides*Math.random() ) + 1;
		return tot;

	} else {

		while ( count++ < 0 ) tot += Math.floor( sides*Math.random() ) + 1;
		return -tot;

	}

}