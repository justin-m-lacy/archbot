const rollex = /^([\+\-]?\d*)\s*d\s*(\d*)\s*([\+\-]?\d+)?/;

exports.roll = roll;

/**
 * Represents a roller object of the form (n)d(s) + b
 */
exports.Roller = class Roller {

	/**
	 * Creates a new Roller object from a string description
	 * of the dice roll.
	 * Any errors in input are ignored and default to 1d6+0
	 * @param {string} str - roll in the form of nds+b
	 * @returns {Roller} the Roller object created.
	 */
	static FromString( str ) {

		let res = rollex.exec( str );
		if ( res === null ) return new Roller();

		let num = res.length > 1 ? parseInt( res[1] ) : 1;
		let sides = res.length > 2 ? parseInt( res[2] ) : 6;
		let bonus = res.length > 3 ? parseInt( res[3] ) : 0;

		if ( Number.isNaN(num ) ) num = 1;
		if ( Number.isNaN(sides )) sides = 6;
		if ( Number.isNaN(bonus)) bonus = 0;

		return new Roller( num, sides, bonus );

	}

	/**
	 * Creates a roller from a json object.
	 * @param {Object|string} json
	 * @returns {Roller} 
	 */
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
		return this.bonus ? ( this.count + 'd' + this.sides + '+' + this.bonus ) : this.count + 'd' + this.sides;
	}

	/**
	 * Roll of this roller the given number of times, then return the summed result.
	 * @param {Number} N - number of times to repeat the roll of this Roller.
	 * @returns {Number} the total of all roll results.
	 */
	repeat( N ) {

		var tot = 0;
		while( N-- > 0 ) {
			tot += this.roll();
		}
		return tot;

	}

	/**
	 * Get a random roll of the Roller object.
	 * @returns {Number} the value of the roll.
	 */
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
 * @returns {Number} the result of the dice roll. 
 */
exports.parseRoll = str => {

	let res = rollex.exec( str );
	if ( res === null ) return roll(1,6);

	let num = res.length > 1 ? parseInt( res[1] ) : 1;
	let sides = res.length > 2 ? parseInt( res[2] ) : 6;
	let bonus = res.length > 3 ? parseInt( res[3] ) : 0;

	if ( Number.isNaN(num ) ) num = 1;
	if ( Number.isNaN(sides )) sides = 6;
	if ( Number.isNaN(bonus)) bonus = 0;

	return roll( num, sides, bonus );

	let tot = bonus;

}

/**
 * Rolls the given number of a die with the given number of sides,
 * adding the end bonus to the result.
 * @param {Number} count - The number of times to roll the given die.
 * @param {Number} sides - The number of sides on the die.
 * @param {Number} bonus - A bonus to add or subtract after the dice are rolled.
 * @returns {Number} The result of the roll.
 */
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