const dice = require( './dice.js');

exports.DamageSrc = class DamageSrc {

	static FromString( dmg, type ) {
		return new DamageSrc( dice.Roller.FromString(dmg), type );
	}

	static FromJSON( json ) {

		if ( typeof(json) === 'string') {
			return new DamageSrc( dice.Roller.FromString( json));
		} else {

			//console.log( 'PARSING DMG SOURCE: ' + json );

			if ( json.dmg ) {
				return new DamageSrc( dice.Roller.FromString( json.dmg ), json.type );
			} else {
				console.log('err damge source');
				return new DamageSrc( new dice.Roller(json.count, json.sides, json.bonus), json.type );
			}

		}
	}

	toJSON() { return { dmg:this.roller.toString(), type:this.type }; }

	get bonus() { return this.roller.bonus; }
	set bonus(v) { this.roller.bonus = v;}
	get sides() { return this.roller.sides;}
	set sides(v) { this.roller.sides = v;}
	get count() { return this.roller.count; }
	set count(v) { this.roller.count = v;}

	constructor( roller, type=null ) {

		this.roller = roller;
		this.type = type || 'mystery';

	}

	toString() { return this.roller.toString() + ' ' + this.type; }

	roll() { return this.roller.roll(); }

}

const ops = [ '+', '/', '-', '*', '%', 'd','='];
const priority = { '=':2,'+':3,'-':3,'/':4,'*':4, '%':4,'d':5,'(':0 };

const CONST = 1;
const VAR = 2;
const OP = 3;
const OPEN = 4; // parens
const CLOSE = 5;
const ERR = 0;

class Formula {

	static TryParse(str) {
		if ( !str ) return false;
		return new FormulaParser( str ).parse();
	}

	constructor( str, queue=null) {
		this._str = str;
		this.queue = queue || Formula.TryParse(str);

		for( let i = this.queue.length-1; i >= 0; i-- ) {
			console.log('stack: ' + this.queue[i].value);
		}

	}

	toJSON() { return this._str; }

	eval( tar ) {

		// next item from stack.
		let qIndex = 0, len = this.queue.length;

		let vals = [];	// values read from stack.

		let cur,tx,ty;

		// TODO: this is wrong.
		while ( qIndex < len ) {

			cur = this.queue[qIndex++];

			if ( cur.type === OP ){

				if ( vals.length < 1 ) {
					console.log( 'ERR: 2 args required: ' + this._str );
					console.log( 'cur op: ' +  cur.op );
					break;
				}

				// args are backwards on stack.
				ty = vals.pop();
				if ( ty instanceof Token) console.log( ty.value );
				else console.log( 'value: ' + ty );

				tx = vals.pop();
				if ( tx instanceof Token) console.log( 'value: ' + tx.value );
				else console.log( tx );


				if ( cur.op === '=') {
					vals.push( this.assign( tar, tx, ty ) );
				} else vals.push( this.doOp( cur.op, tar, tx, ty ) );

			} else vals.push( cur );

		}

		if ( vals.length === 0 ) console.log( 'ERR: no output: ' + this._str );

		return vals.pop();

	}

	assign( tar, x, y ) {

		if ( x instanceof Token ) x = x.value;	// string value.
		if ( y instanceof Token ) y = y.eval(tar);

		console.log( 'assinging Val to: ' + x );
		return tar[x] = y;

	}

	doOp( op, tar, x, y ) {

		if ( x instanceof Token ) x = x.eval(tar);
		if ( y instanceof Token ) y = y.eval(tar);

		console.log( `OP: ${x} ${op} ${y}`);

		switch ( op ) {

			case '+': return y ? x + y : x;
			case '-': return y ? x - y : -x;
			case '*': return x * y;
			case 'd':
				return this.roll( x, y );
			case '/': return x / y;
			case '%': return x % y;
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
		console.log('rolling: ' + x + 'd' + y );
		while ( x-- > 0 ) tot += Math.floor( y*Math.random() + 1 );

		return neg ? -tot : tot;

	}

}

class FormulaParser {

	constructor( str ) {
		this.str = str;
		this.len = str.length;
	}

	parse() {

		let len = this.len;

		this.index = 0;
		let opStack = [];
		let resStack = [];

		var token, top = null;
		var curPriority;

		while ( this.index < len ) {

			token = this.readToken();
			if ( token.type === OP) {

				curPriority = priority[token.op];
				while( opStack.length > 0 ) {

					top = opStack.pop();
					if ( top === null ) {
						console.log( 'unexpected null op: ' + this.str );
						break;
					} else if ( priority[top.op] < curPriority) {
						opStack.push( top );	// todo: slightly inefficient.
						break;
					}

					resStack.push( top );	// high-priority op to output.

				}
				opStack.push( token );

			} else if ( token.type === OPEN ) {
	
				console.log( 'PUSHING OPEN PAREN');
				opStack.push( token );

			} else if ( token.type === CLOSE ) {

				while ( opStack.length > 0 ) {

					// pop to open paren.
					top = opStack.pop();
					console.log('POPPED: ' + top.value );
					console.log( 'stack len: ' + opStack.length );

					if ( top.type === OPEN ) break;
					resStack.push( top );
	
				}
				if ( top === null || top.type !== OPEN ) console.log('Missing close paren: ' + top.op );

			} else {
				console.log('pushing res value');
				resStack.push( token );
			}

		}

		while ( opStack.length > 0 ) resStack.push( opStack.pop() );

		return new Formula( this.str, resStack );

	}

	readToken() {

		let c = this.str[ this.index ];

		while ( c === ' ' || c === '\t' ) c = this.str[ ++this.index ];

		if ( c === '(') {this.index++; return new Token( c, OPEN); }
		if ( c === ')') { this.index++; return new Token( c, CLOSE ); }

		if ( ops.includes(c) ) {
			console.log('CREATING OP');
			this.index++;
			return new Token( c, OP );
		}
		console.log('READING VALUE');
		return this.readValue();
	}

	readValue() {

		let ind = this.index;
		//console.log( 'reading val at: ' + ind );
		let start = ind;

		let n = this.str.charCodeAt( ind );

		// digit OR +,-,.
		if ( this.isDigit(n) || n === 43 || n === 45 || n === 46 ) {

			console.log('reading digit');
			while ( this.isDigit( this.str.charCodeAt(++ind ) ) );

			this.index = ind;
			return new Token( Number( this.str.slice(start, ind )), CONST );


		} else if ( this.isChar(n) ) {

			console.log('reading var');
			while ( this.isChar( this.str.charCodeAt(++ind ) ) );

			this.index = ind;
			return new Token( this.str.slice( start, ind ), VAR );

		} else {

			console.log( `INVALID CHAR AT  ${(ind)}: ${this.str.charCodeAt( (ind) )}` );
			this.index = ++ind;
			return new Token( 0, ERR );
		}

	}

	isDigit( n ) { return n >= 48 && n <= 57; }
	isChar( n ) { return (n >= 65 && n <= 90) || (n >= 97 && n <= 122); }

}

module.exports.Formula = Formula;

class Token {

	get value() { return this.val; }
	// makes OP explicit.
	get op() { return this.val; }

	constructor( val, type ) {

		console.log('creating token: ' + val );

		this.val = val;
		this.type = type;
	}

	eval( tar ) {

		if ( this.type === CONST ) return this.val;
		return tar[this.val];

	}

}