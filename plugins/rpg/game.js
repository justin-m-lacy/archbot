const Race = require('./race');
const Class = require('./charclass');
const Party = require( './social/party');
const Combat = require('./combat');
const dice = require( './dice');
const Guild = require( './social/guild');
const util = require( '../../jsutils');
const Trade = require( './trade');
const item = require( './items/item');
const itgen = require( './items/itemgen');

var events = ['explored', 'crafted', 'levelup', 'died', 'pks', 'eaten'];

exports.getLore = (wot) => {

	let val = Race.GetRace( wot );
	if ( val ) return wot + ': ' + val.desc;

	val = Class.GetClass( wot );
	if ( val ) return wot + ': ' + val.desc;

	return 'Unknown entity: ' + wot;

}

/**
 * actions not allowed for each player state.
*/
var illegal_acts = {
	"dead":{ 'brew':1, 'map':1, 'hike':1, 'scout':1,
		"take":1,"attack":1,'drop':1, "equip":1, "unequip":1, "steal":1, "craft":1, "track":1, "quaff":1,
		'give':1,'eat':1,'cook':1, "sell":1, "destroy":1, "inscribe":1, "revive":1
	}
};

// actions that allow some hp recovery.
var rest_acts = { 'move':1, 'cook':1, 'drop':1 };
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

exports.Game = class Game {

	/**
	 *
	 * @param {RPG} rpg
	 * @param {Cache} charCache character cache.
	 * @param {World} world RPG world
	 */
	constructor( rpg, charCache, world ) {

		this.rpg = rpg;
		this.world = world;

		this._cache = this.rpg.cache;
		this.charCache = charCache;

		this.guilds = new Guild.Manager( this._cache.subcache('guilds') );

		// parties by char name.
		this._parties = {};

	}

	skillRoll( act ) { return dice.roll( 1, 5*( act.level+4) ); }

	/**
	 * Determines whether a character can perform a given action
	 * in their current state.
	 * @param {Character} char
	 * @param {string} act - action to attempt to perform.
	 */
	canAct( char, act ) {
		let illegal = illegal_acts[ char.state ];
		if ( illegal && illegal.hasOwnProperty(act)) {
			char.log( `Cannot ${act} while ${char.state}.` );
			return false;
		}

		return true;
	}

	tick( char, action ) {

		char.clearLog();

		if ( !this.canAct(char, action ) ) return false;

		this.tickEffects( char, action );

	}

	async move( char, dir ) {

		if ( this.tick( char, 'move') ===false ) return char.getLog();

		let res = await this.world.move( char, dir );

		let p = this.getParty( char );
		if ( p && p.leader === char.name ) {

			//console.log('Moving party to: ' + char.loc.toString() );
			await p.move( char.loc );

		} else char.recover();

		return char.output( res );
	}

	async hike( char, dir ) {

		if ( this.tick( char, 'hike') === false ) return char.getLog();

		let d = char.loc.abs();

		let r = this.skillRoll( char ) + char.getModifier('dex') + char.getModifier('wis');
		let p = this.getParty( char );

		r -= d/10;
		if ( p && p.isLeader(char ) ) r -= 5;
		if ( !char.hasTalent('hike')) r -= 20;

		if ( r < 0 ) {
			char.hp -= Math.floor( Math.random()*d );
			return char.output( `${char.name} was hurt trying to hike. hp: (${char.hp}/${char.maxHp})` );
		}
		else if ( r < 10 ) return char.output('You failed to find your way.');

		let loc = await this.world.hike( char, dir );
		if ( !loc ) return char.output( 'You failed to find your way.' );

		if ( p && p.leader === char.name ) {

			//console.log('Moving party to: ' + char.loc.toString() );
			await p.move( char.loc );

		}

		return char.output( `${char.name}: ${loc.look()}` );

	}

	getParty( char ) { return this._parties[char.name]; }

	makeParty( char, ...invites ) {

		let p = new Party( char, this.charCache );
		this._parties[char.name] = p;

		for( let i = invites.length-1; i >=0;i-- ) p.invite( invites[i] );

	}

	setLeader( char, tar ) {

		let party = this.getParty( char );
		if ( !party ) return 'You are not in a party.';

		if ( !tar ) { return `current leader: ${party.leader}.`}

		if ( !party.isLeader(char) ) return 'You are not the party leader.';

		if ( party.setLeader( tar ) ) return `${tar.name} is now the party leader.`;
		return `Could not set ${tar.name} to party leader.`;
	}

	async party( char, t ) {

		let party = this.getParty( char );
		if ( !t ) return party ? await party.getStatus() : "You are not in a party.";

		let other = this.getParty( t );

		if ( party ) {

			if ( other === party ) return `${t.name} is already in your party.`;
			if ( other ) return `${t.name} is already in a party:\n${party.getList()}`;
			if ( !party.isLeader(char) ) return 'You are not the party leader.';

			party.invite( t );
			return `${char.name} has invited ${t.name} to join their party.`;

		} else if ( other ) {

			// attempt to accept.
			if ( !other.acceptInvite( char ) ) return `${other.getList()}\\nnYou have not been invited to ${other.leader}'s awesome party.`;

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

		if ( p.leave( char ) ) {
			// party contains <=1 person, and no invites.
			p.names.forEach( n => delete this._parties[n] );
			return `${name}'s party has been disbanded.`;
		}

		return `${name} has left the party.`;

	}

	async mkGuild( char, gname ) {

		if ( char.guild ) return `${char.name} is already in a guild.`;

		let g = await this.guilds.GetGuild(gname);
		if ( g) return `${gname} already exists.`;

		g = await this.guilds.MakeGuild( gname, char );
		char.guild = gname;

		return `${char.name} created guild '${gname}'.`;

	}

	async joinGuild( char, gname ) {

		if ( char.guild ) return `${char.name} is already in a guild.`;

		let g = await this.guilds.GetGuild(gname);
		if ( !g ) return `${gname} does not exist.`;

		if ( g.acceptInvite( char) ) {
			char.guild = gname;
			return `${char.name} has joined ${gname}.`;
		}
		return `${char.name} has not been invited to ${gname}.`;

	}

	async leaveGuild( char ) {

		let g = char.guild ? await this.guilds.GetGuild(char.guild) : null;
		if ( !g ) {
			return `${char.name} is not in a guild.`;
		}

		g.leave(char);
		char.guild = null;

		return `${char.name} has left ${g.name}.`;

	}

	async guildInv( char, who ) {

		let g = char.guild ? await this.guilds.GetGuild(char.guild) : null;
		if ( !g ) {
			return `${char.name} is not in a guild.`;
		}

		if ( !g.isLeader(char) ) return `You do not have permission to invite new members to ${g.name}.`;
		g.invite( who );

		return `${who.name} invited to guild '${g.name}'.`;

	}

	goHome( char ) {

		if( this.tick( char, 'home') === false ) return char.getLog();

		return char.output( this.world.goHome( char ) );

	}

	compare( char, wot ) {

		let it = char.getItem( wot );
		if ( !it ) return 'Item not found.';

		let res = 'In Pack: ' + it.getDetails() + '\n';
		let eq = char.getEquip( it.slot );

		if ( !eq) res += 'Equip: nothing';
		else if ( Array.isArray( eq ) ) res += 'Equip: ' + item.Item.DetailsList( eq );
		else res += 'Equip: ' + eq.getDetails();

		return res;

	}

	equip( char, wot ) {

		if ( !wot ) return `${char.name} equip:\n${char.listEquip()}`;

		if ( this.tick( char, 'equip') === false ) return char.getLog();

		let res = char.equip(wot);
		if ( res === true ) res = char.name + ' equips ' + wot;	// TODO,echo slot used.
		else if ( typeof(res) === 'string');// return res;
		else res = char.name + ' does not have ' + wot;

		return char.output( res );

	}

	inscribe( char, wot, inscrip ) {

		if ( this.tick( char, 'inscribe') === false ) return char.output();

		let item = char.getItem( wot );
		if ( !item ) return char.output( 'Item not found.' );

		item.inscription = inscrip;
		char.addHistory( 'inscribe');

		return char.output( `${item.name} inscribed.` );

	}

	destroy( char, first, end ) {

		if ( this.tick( char, 'destroy') === false ) return char.output();

		if ( end ) {

			let itms = char.takeItems( first, end );
			if ( !itms) return char.output( 'Invalid item range.');
			return char.output( itms.length + ' items destroyed.' );

		} else {

			let item = char.takeItem( first );
			if ( !item ) return char.output( `'${first}' not in inventory.` );

			return char.output( item.name + ' is gone forever.' );

		} //

	}

	sell( char, first, end ) {

		if( this.tick( char, 'sell') === false ) return char.output();

		return char.output( Trade.sell( char, first, end ) );

	}

	give( src, dest, expr ) {

		if ( this.tick( src, 'give') === false ) return src.output();

		return src.output( Trade.transfer( src, dest, expr ) );

	}

	cook( char, wot ) {

		if ( this.tick( char, 'cook') === false) return char.output();

		return char.output( char.cook( wot ) );

	}

	brew( char, itemName, imgURL=null ) {

		if ( !char.hasTalent('brew')) return `${char.name} does not know how to brew potions.`;

		let pot = itgen.genPot( itemName );
		if (!pot) return `${char.name} does not know how to brew ${itemName}.`;

		if ( this.tick( char, 'brew') === false) return char.output();



		let s = this.skillRoll( char ) + char.getModifier('wis');
		if ( s < 10*pot.level ) {
			return char.output( `${char.name} failed to brew ${itemName}.` );
		}

		if ( pot.level ) char.addExp( 2*pot.level );
		char.addHistory( 'brew');
		let ind = char.addItem( pot );

		return char.output( `${char.name} brewed ${itemName}. (${ind})` );

	}

	craft( char, itemName, desc, imgURL=null ) {

		if( this.tick( char, 'craft') === false ) return char.output();

		let ind = item.Craft( char, itemName, desc, imgURL );

		return char.output( `${char.name} crafted ${itemName}. (${ind})` );

	}

	unequip( char, slot ) {

		if ( this.tick( char, 'unequip') === false ) return char.output();

		if ( !slot ) return char.output( 'Specify an equip slot to remove.' );

		if ( char.unequip(slot) ) return char.output( 'Removed.' );
		return char.output( 'Cannot unequip from ' + slot );

	}

	async drop( char, what, end ) {

		if( this.tick( char, 'drop') === false ) return char.output();

		return char.output( await this.world.drop( char, what, end ) );

	}

	async take( char, first, end ) {

		if( this.tick( char, 'take') === false ) return char.output();

		return char.output( await this.world.take( char, first, end ) );

	}

	revive( char, targ ) {

		if ( targ.state !== 'dead') return `${targ.name} is not dead.`;
		let p = this.getParty( char );
		if ( !p || !p.includes(targ) ) return `${targ.name} is not in your party.`;

		if ( this.tick( char, 'revive' ) === false ) return char.output();

		let roll = this.skillRoll(char) + char.getModifier('wis') + 2*targ.curHp - 5*targ.level;
		if ( !char.hasTalent('revive')) roll -= 20;
		if ( roll < 10 ) return char.output( `You failed to revive ${targ.name}.` );

		char.addHistory('revived');

		targ.revive();
		return char.output( `You have revived ${targ.name}.` );

	}

	async rest( char ) {

		if ( this.tick( char, 'rest' ) === false ) return char.output();

		let p = this.getParty(char);
		if ( p && p.isLeader(char) ) {

			let pct = Math.round( 100 * await p.rest() );
			if ( pct === 100 ) return char.output( `${p.name} fully rested.` );
			else return char.output( `${p.name} ${pct}% rested.` );

		} else char.rest();

		return char.output( `${char.name} rested. hp: ${char.curHp}/${char.maxHp}` );

	}

	scout( char ) {

		if ( this.tick( char, 'scout' ) === false ) return char.output();

		let r = (char.skillRoll() + char.getModifier('int'));

		if ( r < 5 ) return char.output( 'You are lost.' );

		let coord = char.loc;

		let err = Math.floor( 400 / r );
		let x = Math.round( coord.x + err*( Math.random() - 0.5) );
		let y = Math.round( coord.y + err*( Math.random() - 0.5) );

		return char.output( `You believe you are near (${x},${y}).` );

	}

	tickEffects( char, action ) {

		let efx = char.effects;
		if ( !efx ) return;

		console.log( 'effects count: ' + efx.length );

		for( let i = efx.length-1; i >= 0; i-- ) {

			let e = efx[i];
			if ( e.tick( char ) ) {
				// efx end.
				console.log('EFFECT END: ' + e.name );
				util.fastCut( efx, i );
				e.end( char );

			}

		}

	}

	track( char, targ ) {

		if( this.tick( char, 'track') === false ) return char.output();

		let r = (char.skillRoll() + char.getModifier('int')); // - (targ.skillRoll() + targ.getModifier('wis') );
		if ( char.hasTalent('track') ) r *= 2;
		else r -= 10;

		let src = char.loc;
		let dest = targ.loc;
		let d = src.dist( dest );

		if ( d === 0 ) return char.output( `${targ.name} is here.` );
		else if ( d <= 2 ) return char.output( `You believe ${targ.name} is nearby.` );
		else if ( d > r ) return char.output( `You find no sign of ${targ.name}` );

		let a = Math.atan2( dest.y - src.y, dest.x - src.x )*180/Math.PI;
		let abs = Math.abs(a);

		let dir;
		if ( abs < (90-45/2)) dir = 'east';
		else if ( abs > (180-(45/2))) dir = 'west';

		if ( a > 0 && Math.abs(90-a) < (3*45)/2 ) dir = dir ? 'north ' + dir : 'north';
		else if ( a < 0 && Math.abs(-90-a) < (3*45)/2 ) dir = dir ? 'south ' + dir : 'south';

		let dist;
		if ( d < 20 ) dist = '';
		else if ( d < 50 ) dist = 'somewhere';
		else if ( d < 125 ) dist = 'far';
		else if ( d < 225 ) dist = 'incredibly far';
		else if ( d < 300 ) dist = 'unbelievably far';
		else dist = 'imponderably far';

		return char.output( `You believe ${targ.name} is ${ dist ? dist + ' ' : ''}to the ${dir}.` );

	}

	async attackNpc( src, npc ) {

		if( this.tick( src, 'attack') === false ) return src.output();

		let p1 = this.getParty( src );
		if ( !p1 || !p1.isLeader(src) ) p1 = src;

		let com = new Combat( p1, npc, this.world );
		await com.fightNpc();

		return src.output( com.getText() );

	}

	steal( src, dest, wot ) {

		if ( this.tick( src, 'steal') === false ) return src.output();

		let com = new Combat( src, dest, this.world );
		com.steal( wot );

		return src.output( com.getText() );

	}

	async attack( src, dest ) {

		if( this.tick( src, 'attack') === false ) return src.output();

		let p1 = this.getParty( src ) || src;
		let p2 = this.getParty( dest );

		if ( !p2 || ( !p2.isLeader(dest) && !p2.loc.equals( dest.loc )) ) p2 = dest;

		let com = new Combat( p1, p2, this.world );
		await com.fight();

		return src.output( com.getText() );

	}

	quaff ( char, wot ) {

		if( this.tick( char, 'quaff' ) === false ) return char.output();

		let p = char.getItem( wot );
		if ( !p ) return char.output( 'Item not found.' );
		if ( p.type !== 'potion') return char.output( `${p.name} cannot be quaffed.` );

		// remove the potion.
		char.takeItem( p );
		char.addHistory( 'quaff');
		p.quaff( char );

		return char.output( `${char.name} quaffs ${p.name}.` );

	}

	eat ( char, wot ) {

		if( this.tick( char, 'eat' ) === false ) return char.output();
		return char.output( char.eat( wot ) );

	}

} //Game

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