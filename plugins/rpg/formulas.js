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
const priority = { '=':0,'+':1,'-':1,'/':2,'*':2,'d':3 }

const CONST = 1;
const VAR = 2;
const OP = 3;
const OPEN = 4; // parens
const CLOSE = 5;
const ERR = 0;


module.exports.Formula = class Formula {

	static TryParse(str) {
		if ( !str ) return false;
		return new FormulaParser( str ).parse();
	}

	constructor( str, stack=null) {
		this._str = str;
		this.stack = stack || Formula.TryParse(str);
	}

	toJSON() { return this._str; }

	eval( tar ) {

		let expr = this.stack.slice();
		let vals = [];

		let cur,tx,ty;

		// TODO: this is wrong.
		while ( expr.length > 1 ) {

			cur = expr.pop();

			if ( cur.type === OP ){

				if ( vals.length < 1 ) {
					console.log( 'ERR: 2 args required: ' + this._str );
					console.log( 'cur op: ' +  cur.op );
					break;
				}

				//assume two-args.
				
				tx = vals.pop();
				ty = vals.pop();
	
				if ( cur.op === '=') {
					this.assign( tar, tx, ty );
				}

				vals.push( this.doOp( cur.op, tar, tx, ty ) );

			} else vals.push( cur );

		}

		if ( vals.length === 0 ) console.log( 'ERR: no output: ' + this._str );

		return vals.pop();

	}

	assign( tar, x, y ) {

		tar[x] = y;

	}

	doOp( op, tar, x, y ) {

		if ( x instanceof Token ) x = x.eval(tar);
		if ( y instanceof Token ) y = y.eval(tar);
		switch ( op ) {

			case '+':
				return y ? x + y : x;
			case '-':
				return y ? x - y : -x;
			case '*':
				return x * y;
			case 'd':
				return this.roll( x, y );
			case '/':
				return x / y;
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

class FormulaParser {

	constructor( str ) {

		this.str = str;
		this.index = 0;
		this.len = str.length;

	}

	parse( str ) {

		let opStack = [];
		let resStack = [];

		var token, top = null;
		var curPriority;

		while ( token = readToken() ) {

			if ( token.type === OP) {

				curPriority = priority[token.op];
				while( opStack.length > 0 ) {

					top = opStack.pop();
					if ( top === null ) {
						console.log( 'unexpected null op: ' + FormulaParser._str );
						break;
					} else if ( priority[top.op] < curPriority) {
						opStack.push( top );	// todo: slightly inefficient.
						break;
					}

					resStack.push( top );	// high-priority op to output.

				}
				opStack.push( token );

			} else if ( token.type === OPEN ) {
	
				opStack.push( token );

			} else if ( token.type === CLOSE ) {

				while ( opStack.length > 0 ) {

					// pop to open paren.
					top = opStack.pop();
					if ( top.type === OPEN ) break;

					resStack.push( top );
	
				}
				if ( top === null || top.type !== OPEN ) console.log('Missing close paren: ' + top.op );

			} else {
				resStack.push( token );
			}

		}

		while ( opStack.length > 0 ) FormulaParser.resultStack.push( opStack.pop() );

		// result is 'pushed' for efficiency, which causes the expression to be backwards.
		resStack.reverse();
		return resStack;

	}

	readToken() {

		let c = this.str[ this.index ];
		if ( ops.includes(c) ) {
			this.index++;
			return new Token( c, OP );
		}
		return this.readValue();
	}

	readValue() {

		let ind = this.index;
		let start = ind;

		let n = this.str.charCodeAt( ind++ );
		if ( n == '+' || n === '-') {
			n = this.str.charCodeAt(ind++);
		}

		if ( this.isDigit(n) ) {

			while ( this.isDigit( this.str.charCodeAt(ind++ ) ) );

			this.index = ind;
			return new Token( Number( this.str.slice(start, ind )), VAR );


		} else if ( this.isChar(n) ) {

			while ( this.isChar( this.str.charCodeAt(ind++ ) ) );

			this.index = ind;
			return new Token( this.str.slice( start, ind ), VAR );

		} else {

			console.log( 'UNEXPECTED CHAR: ' + this.str.charCodeAt( (ind-1) ));
			this.index = ind;
			return new Token( 0, ERR );
		}

	}

	isDigit( n ) { return n >= 48 && n <= 57; }
	isChar( n ) { return (n >= 65 && n <= 90) || (n >= 97 && n <= 122); }

}

class Token {

	get value() { return this.val; }
	// makes OP explicit.
	get op() { return this.val; }

	constructor( val, type ) {
		this.val = val;
		this.type = type;
	}

	eval( tar ) {

		if ( this.type === CONST ) return this.val;
		return tar[this.val];

	}

}