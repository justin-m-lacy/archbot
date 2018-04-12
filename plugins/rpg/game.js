const Race = require('./race.js');
const Class = require('./charclass.js');
const Party = require( './social/party.js');
const Combat = require('./combat.js');
const dice = require( './dice.js');
const Guild = require( './social/guild.js');
const util = require( '../../jsutils.js');
const Trade = require( './trade.js');
const item = require( './items/item.js');
const itgen = require( './items/itemgen.js');

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
	"dead":{ "brew":1, "map":1,
		"take":1,"attack":1,"drop":1, "equip":1, "unequip":1, "steal":1, "craft":1, "track":1, "quaff":1,
		"give":1,"eat":1,"cook":1, "sell":1, "destroy":1, "inscribe":1, "revive":1
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
	 */
	constructor( rpg, charCache, world ) {

		this.rpg = rpg;
		this.world = world;

		this._cache = this.rpg.cache;
		this.charCache = charCache;
		this._gcache = this._cache.makeSubCache( 'guilds');

		Guild.SetCache( this._gcache );

		// parties by char name.
		this._parties = {};

	}

	skillRoll( act ) { return dice.roll( 1, 5*( act.level+4) ); }

	actionErr( char, act ) {
		let illegal = illegal_acts[ char.state ];
		if ( illegal && illegal.hasOwnProperty(act)) return `Cannot ${act} while ${char.state}.`;
		return false;
	}

	getParty( char ) { return this._parties[char.name]; }

	async move( char, dir ) {


		let res = await this.world.move( char, dir );

		let p = this.getParty( char );
		if ( p && p.leader === char.name ) {

			//console.log('Moving party to: ' + char.loc.toString() );
			await p.move( char.loc );

		} else char.recover();
		return res;
	}

	async hike( char, dir ) {

		let loc = await this.world.hike( char, dir );
		if ( !loc ) return 'Hike failed.';

		let p = this.getParty( char );
		if ( p && p.leader === char.name ) {

			//console.log('Moving party to: ' + char.loc.toString() );
			await p.move( char.loc );

		} else char.recover();
		return `${char.name}: ${loc.look()}`;

	}

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
			if ( !other.accept(char ) ) return `${other.getList()}\\nnYou have not been invited to ${other.leader}'s awesome party.`;

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

	goHome( char ) {

		let res = this.actionErr( char, 'home');
		if ( res ) return res;

		return this.world.goHome( char );

	}

	compare( char, wot ) {

		let it = char.getItem( wot );
		if ( !it ) return 'Item not found.';

		let res = 'In Pack: ' + it.getDetails() + '\n';
		let eq = char.getEquip( it.slot );

		if ( !eq) res += 'Equip: nothing';
		else if ( eq instanceof Array ) res += 'Equip: ' + item.Item.DetailsList( eq );
		else res += 'Equip: ' + eq.getDetails();

		return res;

	}

	equip( char, wot ) {

		if ( !wot ) return `${char.name} equip:\n${char.listEquip()}`;

		let res = this.actionErr( char, 'equip');
		if ( res) return res;
		
		res = char.equip(wot);
		if ( res === true ) return char.name + ' equips ' + wot;	// TODO,echo slot used.
		else if ( typeof(res) === 'string') return res;
		else return char.name + ' does not have ' + wot;

	}

	inscribe( char, wot, inscrip ) {

		let res = this.actionErr( char, 'inscribe');
		if ( res) return res;

		let item = char.getItem( wot );
		if ( !item ) return 'Item not found.';

		item.inscription = inscrip;
		char.addHistory( 'inscribe');
		return 'Item inscribed.';

	}

	destroy( char, first, end ) {

		let res = this.actionErr( char, 'destroy');
		if ( res) return res;

		if ( end ) {

			let itms = char.takeItems( first, end );
			if ( !itms) return 'Invalid item range.';
			return itms.length + ' items destroyed.';

		} else {

			let item = char.takeItem( first );
			if ( !item ) return `'${first}' not in inventory.`;

			return item.name + ' is gone forever.';

		} //

	}

	sell( char, first, end ) {

		let res = this.actionErr( char, 'sell');
		if ( res) return res;

		return Trade.sell( char, first, end );

	}

	give( src, dest, expr ) {
		
		let res = this.actionErr( src, 'give');
		if ( res) return res;

		return Trade.transfer( src, dest, expr );

	}

	cook( char, wot ) {

		let res = this.actionErr( char, 'cook');
		if ( res) return res;

		return char.cook( wot )

	}

	brew( char, itemName, imgURL=null ) {

		let res = this.actionErr( char, 'brew');
		if ( res) return res;

		if ( !char.hasTalent('brew')) return `${char.name} does not know how to brew potions.`;

		let pot = itgen.genPot( itemName );
		if (!pot) return `${char.name} does not know how to brew ${itemName}.`;

		let s = this.skillRoll( char ) + char.getModifier('wis');
		if ( s < 10*pot.level ) {
			return `${char.name} failed to brew ${itemName}.`;
		}

		if ( pot.level ) char.addExp( 2*pot.level );
		char.addHistory( 'brew');
		let ind = char.addItem( pot );

		return `${char.name} brewed ${itemName}. (${ind})`;

	}

	craft( char, itemName, desc, imgURL=null ) {

		let res = this.actionErr( char, 'craft');
		if ( res) return res;

		let ind = item.Craft( char, itemName, desc, imgURL );

		return `${char.name} crafted ${itemName}. (${ind})`;

	}

	unequip( char, slot ) {

		let err = this.actionErr( char, 'unequip');
		if ( err ) return err;
	
		if ( !slot ) return 'Specify an equip slot to remove.';

		if ( char.unequip(slot) ) return 'Removed.';
		return 'Cannot unequip from ' + slot;

	}

	async drop( char, what, end ) {

		let err = this.actionErr( char, 'drop');
		if ( err) return err;

		return this.world.drop( char, what, end );

	}

	async take( char, first, end ) {

		let err = this.actionErr( char, 'take');
		if ( err) return err;

		return this.world.take( char, first, end );

	}

	tick( char, action ) {

		char.clearLog();

		if ( this.actionErr(char, action ) ) return char.getLog();

		this.tickEffects( char, action );

		return char.getLog();

	}

	tickEffects( char, action ) {

		let efx = char.effects;
		for( let i = efx.length-1; i >= 0; i-- ) {

			let e = efx[i];
			if ( e.tick( char ) ) {
				// efx end.
				util.fastCut( efx, i );
				e.end();

			}

		}

	}

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
		if ( p && p.isLeader(char) ) {

			let pct = Math.round( 100 * await p.rest() );
			if ( pct === 100 ) return `${p.name} fully rested.`;
			else return `${p.name} ${pct}% rested.`;

		} else char.rest();

		return `${char.name} rested. hp: ${char.curHp}/${char.maxHp}`;

	}

	scout( char ) {

		let r = (char.skillRoll() + char.getModifier('int'));

		if ( r < 5 ) return 'You are lost.';

		let coord = char.loc;

		let err = Math.floor( 400 / r );
		let x = Math.round( coord.x + err*( Math.random() - 0.5) );
		let y = Math.round( coord.y + err*( Math.random() - 0.5) );

		return `You believe you are near (${x},${y}).`;

	}

	track( char, targ ) {

		let r = 4*(char.skillRoll() + char.getModifier('int')); // - (targ.skillRoll() + targ.getModifier('wis') );

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

		let dist;
		if ( d < 20 ) dist = '';
		if ( d < 50 ) dist = 'somewhere';
		if ( d < 125 ) dist = 'far';
		if ( d < 225 ) dist = 'incredibly far';
		if ( d < 300 ) dist = 'unbelievably far';
		else dist = 'imponderably far';

		return `You believe ${targ.name} is ${ dist ? dist + ' ' : ''}to the ${dir}.`;

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
		let p2 = this.getParty( dest );

		if ( !p2 || ( !p2.isLeader(dest) && !p2.loc.equals( dest.loc )) ) p2 = dest;

		let com = new Combat( p1, p2, this.world );
		await com.fight();

		return com.getText();

	}

	quaff ( char, wot ) {

		let res = this.actionErr( char, 'quaff' );
		if ( res ) return res;

		let p = char.getItem( wot );
		if ( !p ) return 'Item not found.';
		if ( p.type !== 'potion') return `${p.name} cannot be quaffed.`;

		// remove the potion.
		char.takeItem( p );
		p.quaff( char );

		return `${char.name} quaffs ${p.name}.`;

	}

	eat ( char, wot ) {

		let res = this.actionErr( char, 'eat' );
		if ( res ) return res;
		return char.eat( wot );

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