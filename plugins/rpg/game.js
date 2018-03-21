const Race = require('./race.js');
const Class = require('./charclass.js');

var events = ['explored', 'crafted', 'levelup', 'died', 'pks', 'eaten'];

exports.getDesc = (wot) => {

	let val = Race.GetRace( wot );
	if ( val ) return wot + ': ' + val.desc;

	val = Class.GetRace( wot );
	if ( val ) return wot + ': ' + val.desc;

	return 'Unknown entity: ' + wot;

}

/**
 * actions not allowed per player state.
*/
var stop_actions = {
	"alive":{},
	"dead":{
		"take":1,"attack":1,"drop":1, "steal":1, "craft":1, "give":1,"eat":1,"cook":1
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