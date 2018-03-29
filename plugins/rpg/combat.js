const Weapon = require( './items/weapon.js');
const forms = require( './formulas.js');
const Char = require( './char/char.js');
const Monster = require( './monster/monster.js');
const itemgen = require( './items/itemgen.js');
const dice = require( './dice.js');

const fist = new Weapon( 'fists', 'Just plain fists.');
fist.damage = new forms.DamageSrc( new dice.Roller(1,2,0), 'blunt');


/**
 * Exp for killing target.
 * @param {*} lvl 
 */
const npcExp = lvl => Math.floor( 10* Math.pow( 1.45, lvl ) );
const pvpExp = lvl =>  Math.floor( 10* Math.pow( 1.45, lvl/2 ) );

module.exports = class Combat {

	getText() { return this.resp; }

	constructor( c1, c2, world ) {

		this.attacker = c1;
		this.defender = c2;
		this.world = world;

		this.resp = '';

	}

	fightNpc() {

		if ( this.defender.state !== 'alive') {
			this.resp += `${this.defender.name} is already dead.`;
			return;
		}

		let atk1 = this.tryHit( this.attacker, this.defender );
		this.resp += '\n';
		let atk2 = this.tryHit( this.defender, this.attacker );

		if ( atk1.dmg ) this.applyHit( this.defender, atk1 );
		if ( atk2.dmg ) this.applyHit( this.attacker, atk2 );

		if ( this.defender.state === 'dead') {
	
			this.world.removeNpc( this.attacker, this.defender );
			this.doLoot( this.attacker, itemgen.genLoot( this.defender.level ) );

		}

	}

	fight() {

		if ( !(this.attacker.loc.equals(this.defender.loc)) ) {
			this.resp += `${this.attacker.name} does not see ${this.defender.name} at their location.`;
			return;
		}
	
		if ( this.defender.state !== 'alive') {
			this.resp += `${this.defender.name} is already dead.`;
			return;
		}

		let atk1 = this.tryHit( this.attacker, this.defender );
		this.resp += '\n';
		let atk2 = this.tryHit( this.defender, this.attacker );

		if ( atk1.dmg ) this.applyHit( this.defender, atk1 );
		if ( atk2.dmg ) this.applyHit( this.attacker, atk2 );
	
	}

	/**
	 * single attack. no reprisal.
	 * @param {Char} src 
	 * @param {Char} dest 
	 */
	attack( src, dest ) {
		if ( !(src.loc.equals(dest.loc)) ) {
			this.resp += `${src.name} does not see ${dest.name} at their location.`;
			return;
		}
		let atk1 = this.tryHit( src, dest );
		if ( atk1.dmg ) this.applyHit( dest, atk1 );
	}

	tryHit( src, dest ) {

		let attack = this.getAttack(src );

		this.resp += `${src.name} attacks ${dest.name} with ${attack.name}`;

		if ( attack.hitroll <= dest.armor ) {
			this.resp += `\n${src.name} misses!`;
		} else {

			attack.rollDmg();

			this.resp += `\n${src.name} Hits for ${attack.dmg} ${attack.dmgType} damage.`;

		}
		return attack;

	}

	applyHit( target, atk ) {

		if ( target.hit( atk.dmg )) {

			this.resp += ` ${target.name} was slain.`;
			if ( atk.actor instanceof Char ) this.doKill( atk.actor, target );

		}

	}

	doKill( char, target ) {

		let lvl = target.level;

		if ( target instanceof Monster ) {

			if ( target.evil ) char.evil += -target.evil/2;
			char.addExp( npcExp( level ) );

		} else {

			char.addExp( pvpExp(level ) );
			char.evil += ( -target.evil ) + 1 + target.getModifier( 'cha');

		}

	}

	getAttack( char ) { return new Attack( char ); }

	/**
	 * 
	 * @param {Item|number|string} wot - optional item to try to take. 
	 */
	steal( wot=null ) {

		if ( !(this.attacker.loc.equals(this.defender.loc)) ) {
			this.resp += `${this.attacker.name} does not see ${this.defender.name} at their location.`;
			return;
		}

		let atk = this.attacker.skillRoll() + this.attacker.getModifier('dex') + this.attacker.getModifier('wis');
		let def = this.defender.skillRoll() + this.defender.getModifier('dex') + this.defender.getModifier('wis');

		let del = atk - def;
		if ( wot ) del -= 5;

		if ( del > 5 ) {

			this.take(this.attacker, this.defender, wot, del );

		} else if ( del < 0 && this.defender.state === 'alive' ) {

			this.resp += `${this.defender.name} catches ${this.attacker.name} attempting to steal.\n`;
			this.attack( this.defender, this.attacker );

		} else {
			this.resp += `${this.attacker.name} fails to steal from ${this.defender.name}`;
		}

	}

	take( src, targ, wot, stealRoll=0) {

		let it;
		if ( wot ) {
	
			it = targ.takeItem(wot);
			if ( !it) {
				this.resp += `${src.name} tries to rob ${targ.name}, but could not find the item they wanted.`;
				return;
			}

		} else it = targ.randItem();

		if ( it ) {

			src.addItem( it );
			this.resp += `${src.name} stole ${it.name} from ${targ.name}.`;

			src.addExp( 2*targ.level );

		} else this.resp += `${src.name} attempts to steal from ${targ.name} but their pack is empty.`;

	}

	doLoot( dest, loot ) {

		if ( !loot.gold && !loot.items ) return;

		this.resp += '\n' + dest.name + ' loots';

		if ( loot.gold ) {
			dest.gold += loot.gold;
			this.resp += ` ${loot.gold} gold`;
		}

		let items = loot.items;
		if ( items && items.length > 0 ) {

			dest.addItem( items );

			if ( loot.gold ) this.resp += ',';
			for( let i = items.length-1; i >= 1; i-- ) {

				this.resp += ' ' + items[i].name + ',';

			}
			this.resp += ' ' + items[0].name;

		}

	} //loot()

}

class Attack {

	get dmgType() { return this.weap.dmgType; }
	get name() { return this._name; }

	get dmg() { return this._dmg; }

	constructor( actor ) {

		this.actor = actor;
		this.weap = this.getWeapon( actor );

		this._name = this.weap.name;

		/*if ( actor instanceof Monster ) {
			console.log( 'mons level: ' + actor.level );
			console.log( 'mons tohit: ' + actor.toHit );
			console.log( 'monster weap hit: ' + this.weap.toHit );
		}*/

		this.hitroll = this.skillRoll( actor ) + actor.toHit + this.weap.toHit;

	} 

	skillRoll( act ) { return dice.roll( 1, 5*( act.level+4) ) ;}

	//monsterHit( m ) { return dice.roll( 1,  5*(m.level+4) ) + m.toHit; }

	rollDmg() {

		let dmg = this.weap.roll() + this.actor.getModifier('str' );
		if ( dmg <= 0 ) dmg = 1;

		this._dmg = dmg;

		return dmg;
	}

	getWeapon(char ) {

		let w = char.getWeapons();
		if ( w === null ) return fist;
		else if ( w instanceof Array ) {
			return w[Math.floor( w.length*Math.random() )];
		} else {
			return w;
		}

	}

}