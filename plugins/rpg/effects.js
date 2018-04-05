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
 * Effect data only. ActiveEffect goes on char.
 */
class Effect {

	static FromData( data ) {

		let e = new Effect();
		if ( data.dot ) {

			e.dot = null;
		}

	}

	constructor() {}

}

class ActiveEffect {

	get effect() { return this._effect; }

	get time() { return this._time; }

	static FromJSON( json ) {

		let e = effects[json. name];
		if ( !e ) return null;

		return new ActiveEffect( e, json.time || e.time );
	}
 
	toJSON() {

		return {
			name:this._effect.name,
			time:this._time
		};

	}

	constructor( effect, time ) {

		this._effect = effect;
		this._time = time;

	}


	tick( actor ) {

		this._time--;

		return ( this._time <= 0 );
	}


}