const Race = require('./race.js');
const Class = require('./charclass.js');
const Party = require( './party.js');
const Combat = require('./combat.js');
const dice = require( './dice.js');
const Guild = require( './world/guild.js');

var events = ['explored', 'crafted', 'levelup', 'died', 'pks', 'eaten'];

exports.getLore = (wot) => {

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
		"give":1,"eat":1,"cook":1, "sell":1, "destroy":1, "inscribe":1, "revive":1
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

		this._cache = this.rpg.cache;
		this._gcache = this._cache.makeSubCache( 'guilds');
		Guild.SetCache( this._gcache );

		// parties by char name.
		this._parties = {};

	}

	getParty( char ) { return this._parties[char.name]; }

	async move( char, dir ) {

		let res = await this.world.move( char, dir );

		let p = this.getParty( char );
		if ( p && p.leader === char.name ) {

			console.log('Moving party to: ' + char.loc.toString() );
			await p.move( char.loc );

		} else char.recover();
		return res;

	}

	makeParty( char, ...invites ) {

		let p = new Party( char, this._cache );
		this._parties[char.name] = p;

		for( let i = invites.length-1; i >=0;i-- ) p.invite( invites[i] );

	}

	setLeader( char, ldrName ) {

		let party = this.getParty( char );
		if ( !party ) return 'You are not in a party.';
		if ( !party.isLeader(char) ) return 'You are not the party leader.';
	
	}

	party( char, t ) {

		let party = this.getParty( char );
		if ( !t ) return party ? party.getList() : "You are not in a party.";

		let other = this.getParty( t );

		if ( party ) {

			if ( other === party ) return `${t.name} is already in your party.`;
			if ( other ) return `${t.name} is already in a different party.`;
			if ( !party.isLeader(char) ) return 'You are not the party leader.';

			party.invite( t );
			return `${char.name} has invited ${t.name} to join their party.`;

		} else if ( other ) {

			// attempt to accept.
			if ( !other.accept(char ) ) return `You have not been invited to ${other.leader}'s awesome party.`;

			this._parties[char.name ] = other;
			return `${char.name} Joined ${other.leader}'s party.`;

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

	async mkGuild( char, gname ) {

		if ( char.guild ) return `${char.name} is already in a guild.`;

		let g = await Guild.GetGuild(gname);
		if ( g) return `${gname} already exists.`;

		g = await Guild.MakeGuild( gname, char );
		char.guild = gname;

		return `${char.name} created guild '${gname}'.`;

	}

	async joinGuild( char, gname ) {

		if ( char.guild ) return `${char.name} is already in a guild.`;

		let g = await Guild.GetGuild(gname);
		if ( !g ) return `${gname} does not exist.`;

		if ( g.accept(char) ) {
			char.guild = gname;
			return `${char.name} has joined ${gname}.`;
		}
		return `${char.name} has not been invited to ${gname}.`;

	}

	async leaveGuild( char ) {

		let g = char.guild ? await Guild.GetGuild(char.guild) : null;
		if ( !g ) {
			return `${char.name} is not in a guild.`;
		}

		g.leave(char);
		char.guild = null;

		return `${char.name} has left ${g.name}.`;

	}

	async guildInv( char, who ) {

		let g = char.guild ? await Guild.GetGuild(char.guild) : null;
		if ( !g ) {
			return `${char.name} is not in a guild.`;
		}

		if ( !g.isLeader(char) ) return `You do not have permission to invite new members to ${g.name}.`;
		g.invite( who );

		return `${who.name} invited to guild '${g.name}'.`;

	}

	actionErr( char, act ) {
		let illegal = illegal_acts[ char.state ];
		if ( illegal && illegal.hasOwnProperty(act)) return `Cannot ${act} while ${char.state}.`;
		return false;
	}

	tick( char, act ) {

		let efx = char.effects;
		for( let i = efx.length-1; i>= 0; i-- ) {

			let e = efx[i];

		}

	}

	skillRoll( act ) { return dice.roll( 1, 5*( act.level+4) ); }

	revive( char, targ ) {

		let res = this.actionErr( char, 'revive' );
		if ( res ) return res;

		let p = this.getParty( char );
		if ( !p || !p.includes(targ) ) return `${targ.name} is not in your party.`;
		if ( targ.state !== 'dead') return `${targ.name} is not dead.`;

		let roll = this.skillRoll(char) + char.getModifier('wis') + 2*targ.curHp - 5*targ.level;
		if ( roll < 10 ) return `You failed to revive ${targ.name}.`;

		char.addHistory('revived');

		targ.revive();
		return `You have revived ${targ.name}.`;

	}

	async rest( char ) {

		let res = this.actionErr( char, 'rest' );
		if ( res ) return res;

		let p = this.getParty(char);
		if ( p && p.isLeader(char) ) p.rest();
		else char.rest();

		return `${char.name} rested. hp: ${char.curHp}/${char.maxHp}`;

	}

	track( char, targ ) {

		let r = (char.skillRoll() + char.getModifier('int')); // - (targ.skillRoll() + targ.getModifier('wis') );

		let src = char.loc;
		let dest = targ.loc;
		let d = src.dist( dest );
		if ( d === 0 ) return `${targ.name} is here.`;
		else if ( d <= 2 ) return `You believe ${targ.name} is nearby.`;

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

	async attackNpc( src, npc ) {

		let res = this.actionErr( src, 'attack');
		if ( res ) return res;

		let p = this.getParty( src );
		if ( p && p.isLeader(src) ) src = p;

		let com = new Combat( src, npc, this.world );
		await com.fightNpc();

		return com.getText();

	}

	steal( src, dest, wot ) {

		let res = this.actionErr( src, 'attack');
		if ( res ) return res;

		let com = new Combat( src, dest, this.world );
		com.steal( wot );

		return com.getText();

	}

	async attack( src, dest ) {

		let res = this.actionErr( src, 'attack');
		if ( res ) return res;

		let p1 = this.getParty( src ) || src;
		let p2 = this.getParty( dest ) || dest;

		let com = new Combat( p1, p2, this.world );
		await com.fight();

		return com.getText();

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