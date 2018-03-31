const forms = require( './formulas.js');

function revive( char ) {

	if ( char.state === 'dead') char.state = 'alive';
	char.curHp = char.maxHp;

}

function kill( char ) {

	char.state = 'dead';
	char.curHp = 0;

}

class Effect {

	constructor() {}

	doTick() {

		if ( this.dot ) {
		}

	}

}