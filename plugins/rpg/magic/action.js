const dice = require( '../dice.js');

class Action {

	static FromJSON( json ) {

		let a = new Action( json.name );

		Object.assign( a, json );

		return a;

	}

	toJSON() { return this; }

	constructor( name ) {

		this.name = name;

	}

	tryApply( char ) {

		// effects with different conditions for each one.
		if ( this.effects ) {

			let len = this.effects.length;
			let e;
			for( let i = 0; i < len; i++ ) {

				e = this.effects[i];
				if ( this.checkRequire( char, e.require ) ) {
					return this.applyEffect( char, e );
				}
				if ( e.err ) return e.err.replace( '%c', char.name );
			}

		} else {

			if ( this.checkRequire( char, this.require ) ){
				return this.applyEffect(char, this );
			}

		}

		if ( this.err ) return this.err.replace( '%c', char.name );
	}

	checkRequire( char, req ) {
		for( let k in req ) {
			if ( char[k] !== req[k] ) return false;
		}
		return true;
	}

	applyEffect( char, eff ) {

		let apply = eff.apply;
		for( let k in apply ) {

			var val = apply[k];
			if ( typeof(val) === 'object') {

				if ( val.roll ) char[k] += dice.parseRoll( val.roll );

			} else char[k] = val;


		}

		if ( eff.fb ) return eff.fb.replace( '%c', char.name );
		return '';

	}

}

var actions = loadActions();

function loadActions() {

	let acts = {};
	let data = require( '../data/magic/actions.json');

	for( let k in data ) {
		acts[k] = Action.FromJSON( data[k] );
	}

	return acts;

}

class Effect {

	constructor( require, apply, fb, err ) {

		this.require = require;
		this.apply = apply;
		this.fb = fb;
		this.err = err;

	}

}

exports.Action = Action;
exports.GetAction = (s)=>{
	return actions[s];
}