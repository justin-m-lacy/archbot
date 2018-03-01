exports.DamageSrc = class DamageSrc {

	static FromString( str ) {

		if ( str == null ) return new DamageSrc();

		let num, sides, bonus;

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
			if ( isNaN(num)) num = 1;
			sides = parseInt( str.slice( ind+1 ) );

		}

		if ( isNaN(sides)) sides = 6;
		return new DamageSrc( num, sides, bonus );

	}

	static FromJSON( json ) {
		return Object.assign( new DamageSrc(), json );
	}

	constructor( count=1, sides=6, bonus=0, type=null ) {

		this.sides = sides;
		this.count = count;
		this.bonus = bonus;
		this.type = type;

	}

	toString() {
		return this.bonus ? this.count + 'd' + this.sides + '+' + this.bonus + ' ' + this.type
			: this.count + 'd' + this.sides + ' ' + this.type;
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