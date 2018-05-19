const forms = require( '../formulas.js');

// effect types. loading at bottom.
const effects = {};

function loadEffects() {

	let efx = require( '../data/magic/effects.json' );
	for( let i = efx.length-1; i >=0; i-- ) {

		var e = efx[i];
		console.log('parsing effect: ' + e.name );
		effects[e.name] = Effect.FromJSON(e);

	} //for

}

/**
 * Effect info only. CharEffect is effect in progress.
 */
class Effect {

	get name() { return this._name;}
	set name(v) { this._name = v;}

	get mods() { return this._mods; }
	set mods(v) { this._mods = v; }

	get dot() {

		// convert to form before return.
		if ( typeof(this._dot) === 'string') {
			this._dot = forms.Formula.TryParse( this._dot );
			return this._dot;
		}
		return this._dot;

	}

	set dot(v) { this._dot = v; }

	get time() { return this._time; }
	set time(v) { this._time = v;}

	static FromJSON( json ) {

		let e = new Effect();
		return Object.assign( e, json );

	}

	static FromData( data ) {

		let e = new Effect();
		if ( data.dot ) e._dot = forms.Formula.TryParse( data.dot );
		if ( data.mods ) e._mods = data.mods;

		return e;

	}

	toJSON() {

		let o = {};

		if ( this._mods ) o.mods = this._mods;
		if ( this._dot ) o._dot = this._dot;	// forms have toJSON()
		if ( this._time ) o.time = this._time;

		return o;

	}

	constructor() {}

}

class CharEffect {

	get name() { return this._effect.name; }

	get effect() { return this._effect; }
	get mods() { return this._effect._mods; }
	get dot() { return this._effect.dot; }

	// source that created the effect.
	get source() { return this._src; }
	set source(v) { this._src = v;}

	get time() { return this._time; }

	static FromJSON( json ) {

		let e = json.effect;
		if ( typeof(e) === 'string' ) e = effects[e];
		else e = Effect.FromJSON(e);
		if ( !e ) return null;

		return new CharEffect( e, json.src, json.time );
	}
 
	toJSON() {

		return {
			src:this._source,
			effect:this._effect.name,
			time:this._time
		};

	}

	constructor( effect, src, time ) {

		this._effect = effect;
		this._source = src;
		this._time = time || this._effect.time;

	}

	start( char ) {

		char.log( `${char.name} is affected by ${this.name}.`);

		if ( this.mods ) {
			console.log('apply mods');
			this.applyMod( this.mods, char );
		};

	}

	end( char ) {

		char.log( `${char.name} ${this.name} has worn off.`);
		if ( this.mods ) {
			this.removeMod( this.mods, char );
		};

	}

	/**
	 * 
	 * @param {Actor} char
	 * @returns {bool} true if effect complete. 
	 */
	tick( char ) {

		if ( this._time ) {
			this._time--;

			let v = this.dot;
			if ( v ) {

				let s = `${char.name} affected by ${this.name}.`;
				v.eval( char );

				let len = v.setProps.size;
				if ( len > 0 ) {

					s += ' ( ';
					for( let k of v.setProps.keys() ) {
						if ( --len > 0 ) s += `${k}: ${char[k]}, `;
						else s += `${k}: ${char[k]}`;
					}
					s += ' )';

				}

				char.log( s);
			

			}

			return ( this._time <= 0 );
		}
		return false;

	}

	applyMod( m, char ) {

		console.log('name: ' + char.name );

		for( let k in m ) {

			let cur = char[k];
			if ( char[k] ) {
				char[k] += m[k];
				char.log( `${char.name} ${k}: ${char[k]}`);				
			}

		}

	}

	removeMod( m, char ) {

		for( let k in m ) {

			if ( char[k] ) {
				char[k] -= m[k];
				char.log( `${char.name} ${k}: ${char[k]}`);		
			}

		}

	}

}

loadEffects();

exports.getEffect = (s)=>effects[s];

exports.CharEffect = CharEffect;
exports.Effect = Effect;