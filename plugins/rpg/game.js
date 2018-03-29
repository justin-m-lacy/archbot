const Race = require('./race.js');
const Class = require('./charclass.js');

var events = ['explored', 'crafted', 'levelup', 'died', 'pks', 'eaten'];

exports.getDesc = (wot) => {

	let val = Race.GetRace( wot );
	if ( val ) return wot + ': ' + val.desc;

	val = Class.GetClass( wot );
	if ( val ) return wot + ': ' + val.desc;

	return 'Unknown entity: ' + wot;

}

/**
 * actions not allowed per player state.
*/
var illegal_acts = {
	"dead":{
		"take":1,"attack":1,"drop":1, "equip":1, "unequip":1, "steal":1, "craft":1,
		"give":1,"eat":1,"cook":1, "sell":1, "destroy":1, "inscribe":1
	}
};

var eventFb = {
	levelup:'%c has leveled up.',
	explored:'%c has found a new area.',
	died:'%c has died.'
};

var eventExp = {
	explored:2,
	crafted:1
};

class Skill {

	get name() { return this._name;}
	set name(v) { this._name = v;}

	get stat() { return this._stat; }
	set stat(v) { this._stat = v;}

	constructor() {}

}

exports.actionErr = ( m, char, act ) => {

	let illegal = illegal_acts[ char.state ];
	if ( illegal && illegal.hasOwnProperty(act)) {
		m.reply( 'Cannot perform action ' + act + ' while ' + char.state );
		return true;
	}
	return false;

}

exports.Game = class Game {

	constructor() {}

	actionErr( char, act ) {
		let illegal = illegal_acts[ char.state ];
		if ( illegal && illegal.hasOwnProperty(act)) return `Cannot ${act} while ${char.state}.`;
		return false;
	}

	rest( char ) {

		let res = this.actionErr( char, 'rest' );
		if ( res ) return res;
		char.rest();
		return `${char.name} rested. hp: ${char.curHp}/${char.maxHp}`;

	}

	eat ( char, wot ) {

		let res = this.actionErr( char, 'eat' );
		if ( res ) return res;
		return char.eat( wot );

	}

}

class Result {

	get event() { return this.event; }
	get err() { return this.err; }

	constructor( resp, isErr, evt ) {

		this.resp = resp;
		this.err = isErr;
		this.event = evt;

	}

}

function ProcessAll( m, char, res ) {

	let resp = '```';

	while ( res ) {

		if ( typeof(res) === 'string ') resp += res;
		else {
			resp += res.resp + '\n';
			res = Process(char,res);
		}
	}

	m.reply( resp + '```' );

}

function Process( char, res ) {

	let evt = res.event;
	if ( evt ) {

		let exp = eventExp[ evt ];
		if ( exp ) {
			char.addExp( exp );
		}

	}

}