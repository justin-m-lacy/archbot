const forms = require( './formulas.js');

// effect types.
const effects = {};

function loadEffects() {

	let efx = require( './data/effects.json' );
	for( let i = efx.length-1; i>=0;i--){

		var e = efx[i];

	} //for

}

function revive( char ) {

	if ( char.state === 'dead') char.state = 'alive';
	char.curHp = char.maxHp;

}

function kill( char ) {

	char.state = 'dead';
	char.curHp = 0;

}

/**
 * Effect data only. CharEffect is effect in progress.
 */
class Effect {

	get name() { return this._name;}
	set name(v) { this._name = v;}

	get mods() { return this._mods; }
	set mods(v) { this._mods = v; }

	get dot() { return this._dot; }
	set dot(v) { this._dot = v;}

	get time() { return this._time; }
	set time(v) { this._time = v;}

	static FromJSON( json ) {

		let e = new Effect();
		if ( data.dot ) e._dot = forms.Formula.TryParse( data.dot );
		if ( data.mods ) e._mods = data.mods;

		return e;

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

	get effect() { return this._effect; }
	get mods() { return this._effect.mods; }
	get dot() { return this._effect.dot; }

	get time() { return this._time; }

	static FromJSON( json ) {

		let e = effects[json. name];
		if ( !e ) return null;

		return new CharEffect( e, json.time || e.time );
	}
 
	toJSON() {

		return {
			name:this._effect.name,
			time:this._time
		};

	}

	constructor( effect ) {

		this._effect = effect;
		this._time = this._effect.time;

	}

	start( actor ) {

		if ( this._mods ) return;
	}

	end( actor ) {
	}

	/**
	 * 
	 * @param {Actor} actor
	 * @returns {bool} true if effect complete. 
	 */
	tick( actor ) {

		if ( this._time ) {
			this._time--;
			return ( this._time <= 0 );
		}
		return false;

	}

	applyMod( m, stats ) {

		for( let k in m ) {

			if ( stats.hasOwnProperty[k] ) {
				stats[k] += m[k];
			}

		}

	}

	removeMod( m, stats ) {

		for( let k in m ) {

			if ( stats.hasOwnProperty[k] ) {
				stats[k] -= m[k];
			}

		}

	}

}

exports.CharEffect = CharEffect;
exports.Effect = Effect;