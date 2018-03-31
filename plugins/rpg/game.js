const Race = require('./race.js');
const Class = require('./charclass.js');
const Party = require( './party.js');

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

var party_acts = [ 'attack', 'move'];

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

	/**
	 * 
	 * @param {RPG} rpg 
	 */
	constructor( rpg, world ) {

		this.rpg = rpg;
		this.world = world;

		// parties by char name.
		this._parties = {};

	}

	getParty( char ) { return this._parties[char.name]; }

	async moveParty( p, coord ) {

		let a = p.names;
		let ldr = p.leader;
	
		p.loc = coord;

		let str = coord.toString();
		console.log( `leader ${ldr} moving to ${str}`);
	
		for( let i = a.length-1; i >= 0; i-- ) {

			if ( a[i] === ldr) continue; 
			var c = await this.rpg.tryGetChar( a[i] );
			console.log( `Moving ${c.name} to ${str}` );
			c.loc = coord;

		}

	}

	async move( char, dir ) {

		let res = await this.world.move( char, dir );

		let p = this.getParty( char );
		if ( p && p.leader === char.name ) {
			console.log('Moving entire party.');
			await this.moveParty( p, char.loc );
		}
		return res;

	}

	makeParty( char, ...invites ) {

		let p = new Party( char );
		this._parties[char.name] = p;

		for( let i = invites.length-1; i >=0;i-- ) {
			p.invite( invites[i] );
		}

	}

	setLeader( char, ldrName ) {

		let party = this.getParty( char );
		if ( !party ) return 'You are not in a party.';
		if ( !party.isLeader(char) ) return 'You are not the party leader.';
	
	}

	party( char, t ) {

		let party = this.getParty( char );
		if ( !t ) {

			if ( party ) return party.getList();
			else return `You are not in a party.`;
	
		}

		let other = this.getParty( t );

		if ( party ) {

			if ( other === party ) return `${t.name} is already in your party.`;
			if ( other ) return `${t.name} is already in a different party.`;
			if ( !party.isLeader(char) ) return 'You are not the party leader.';

			party.invite( t );
			return `${char.name} has invited ${t.name} to join their party.`;

		} else if ( other ) {

			// attempt to accept.
			if ( other.accept(char ) ) {

				this._parties[char.name ] = other;
				return `${char.name} Joined ${other.leader}'s party.`;

			}
			return `You have not been invited to ${other.leader}'s awesome party.`;

		} else {

			// neither has party. new party with invite.
			this.makeParty( char, t );
			return `${char.name} has invited ${t.name} to join their party.`;

		} //

	}

	leaveParty( char ) {

		let name = char.name;

		let p = this.getParty( char );
		if ( !p ) return `${name} is not in a party.`;
		delete this._parties[name];

		if ( p.leave( name ) ) {
			// party contains <=1 person, and no invites.
			p.names.forEach( n => delete this._parties[n] );
			return `${name}'s party has been disbanded.`;
		}

		return `${name} has left the party.`;

	}

	actionErr( char, act ) {
		let illegal = illegal_acts[ char.state ];
		if ( illegal && illegal.hasOwnProperty(act)) return `Cannot ${act} while ${char.state}.`;
		return false;
	}

	skillRoll( act ) { return dice.roll( 1, 5*( act.level+4) ); }

	rest( char ) {

		let res = this.actionErr( char, 'rest' );
		if ( res ) return res;
		char.rest();
		return `${char.name} rested. hp: ${char.curHp}/${char.maxHp}`;

	}

	track( char, targ ) {

		let r = (char.skillRoll() + char.getModifier('int')); // - (targ.skillRoll() + targ.getModifier('wis') );

		let src = char.loc;
		let dest = targ.loc;
		let d = src.dist( dest );
		if ( d === 0 ) return `${targ.name} is here.`;
		else if ( d <= 2 ) return `You believe ${targ.name} is nearby.`;

		console.log( 'roll: ' + r );

		if ( d > r ) return `You find no sign of ${targ.name}`;

		let a = Math.atan2( dest.y - src.y, dest.x - src.x )*180/Math.PI;
		let abs = Math.abs(a);

		let dir;
		if ( abs < (90-45/2)) dir = 'east';
		else if ( abs > (180-(45/2))) dir = 'west';

		if ( a > 0 && Math.abs(90-a) < (3*45)/2 ) dir = dir ? 'north ' + dir : 'north';
		else if ( a < 0 && Math.abs(-90-a) < (3*45)/2 ) dir = dir ? 'south ' + dir : 'south';

		return `You believe ${targ.name} is to the ${dir}.`

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

// TODO: REPLACE WITH PRIORITY QUEUE.
class Scheduler {

	constructor() {
		this._queue = [];
	}

	/**
	 * Schedule at a fixed time from now.
	 * @param {number} time 
	 * @param {function} cb 
	 */
	schedIn( time, cb ) {

		let sched = new SchedTime( Date.now() + time, cb );
		let ind = this._queue.findIndex( it=> it.time >= time );
		if ( ind < 0) {
			this._queue.push( sched );
		} else {
			this._queue.splice( ind, 0, sched);
		}

	}

	schedule( time, cb ){

		let sched = new SchedTime( time, cb );
		let ind = this._queue.findIndex( it=> it.time >= time );
		if ( ind < 0) {
			this._queue.push( sched );
		} else {
			this._queue.splice( ind, 0, sched);
		}


	}

	peek() {
		if ( this._queue.length === 0 ) return null;
		return this._queue[0];
	}

	dequeue() { return this._queue.shift(); }

}

class SchedTime {

	get cb() { return this._cb; }

	constructor( time, cb ) {
		this._time = time;
		this._cb = cb;
	}

}