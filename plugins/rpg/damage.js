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

		let tot = this.bonus;
		let s = this.sides;

		let i = this.count;
		while ( i-- > 0 ) tot += Math.floor( s*Math.random() + 1 );		
		if ( tot < 0) tot = 0;

		return tot;

	}

}

const ops = [ '+', '/', '-', '*', 'd'];
const precede = {

	'+':0,
	'-':0,
	'/':1,
	'*':2,
	'd':3
}

const CONST = 1;
const VAR = 2;
const OP = 3;
const OPEN = 4; // parens
const CLOSE = 5;
const ERR = 0;


class ValueRoll {

	constructor( str) {

		this._str = str;

	}

	toJSON() { return this._str; }

	tryParse(str) {

		if ( str == null ) return;

		let p = new RollParser( str );
		this.tree = p.parse();


	}

	get( char ) {

		let stack = this.tree.slice();
		let tx,ty,top;

		while ( stack.length > 1 ) {

			tx = stack.pop();
			ty = stack.pop();

			top = stack.pop();
			if ( top.type !== OP ) {
				console.log( 'ERR: Operation expected: ' + top.op() );
				break;
			}

			stack.push( doOp( top.op(), tx.value(char), ty.value(char ) ) );

		}


	}

	doOp( op, x, y ) {

		switch ( op ) {

			case '+':
				return x + y;
				break;
			case '-':
				return x - y;
				break;
			case '*':
				return x * y;
				break;
			case 'd':
				return this.roll( x, y );
				break;
			case '/':
				return x / y;
				break;
			default:
				console.log( 'Unexpected op: ' + op );
				return 0;

		}

	}

	roll( x, y ) {

		let neg;
		if ( x < 0 ) {
			neg = true;
			x = -x;
		}

		let tot = 0;
		while ( x-- > 0 ) tot += Math.floor( y*Math.random() + 1 );

		return neg ? -tot : tot;

	}

}

class StatValue {

	constructor( stat, mult, mod ) {

		this.stat = stat;
		this.mult = mult;
		this.mod = mod;
	}

	getValue( char ) {

		if ( mod ) return this.mult*char.getModifier( this.stat);
		return this.mult*char[stat];

	}

}

class RollParser {

	constructor( str ) {

		this.str = str;
		this.index = 0;
		this.len = str.length;

		this.opStack = [];
		this.varStack = [];
		this.resultStack = [];

	}

	parse() {

		var token;
		while ( token = readToken() ) {

			if ( token.type === OP) {

				this.opStack.push( token );

			} else if ( token.type == OPEN ) {
	
				this.opStack.push( token );

			} else if ( token.type == CLOSE ) {

			} else {
				this.varStack.push( token );
			}

		}

	}

	readToken() {

		let c = this.str[ this.index++ ];
		if ( ops.includes(c) ) {
			return new Token( c, OP );
		}
		return new Token( c, ERR );	}

	readValue() {

		let ind = this.index;
		let start = ind;

		let n = this.str.charCodeAt( ind++ );
		if ( n == '+' || n === '-') {
			n = this.str.charCodeAt(ind++);
		}

		if ( this.isDigit(n) ) {

			while ( this.isDigit( this.str.charCodeAt(ind++ ) ) );

			return new Token( Number( this.str.slice(start, ind )), VAR );


		} else if ( this.isChar(n) ) {

			while ( this.isChar( this.str.charCodeAt(ind++ ) ) );

			return new Token( this.str.slice( start, ind ), VAR );

		} else {

			console.log( 'UNEXPECTED CHAR: ' + this.str.charCodeAt( (ind-1) ));
			return new Token( 0, ERR );
		}

	}

	isDigit( n ) { return n >= 48 && n <= 57; }
	isChar( n ) { return (n >= 65 && n <= 90) || (n >= 97 && n <= 122); }

	//readNum() {}
	//readVar() {}

}

class Token {

	constructor( val, type ) {
		this.val = val;
		this.type = type;
	}

	// use when op expected.
	op() { 
		return this.val;
	}

	value( char ) {

		if ( this.type === CONST ) return this.val;

	}

}