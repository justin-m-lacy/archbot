const Weapon = require( './items/weapon.js');
const forms = require( './formulas.js');
const Char = require( './char/char.js');
const Monster = require( './monster/monster.js');

const dice = require( './dice.js');

const fist = new Weapon( 'fists', 'Just plain fists.');
fist.damage = new forms.DamageSrc( new dice.Roller(1,2,0), 'blunt');


/**
 * Exp for killing target.
 * @param {*} targ 
 */
function lvlExp( targ ) {
	return 10*targ.level;
}

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

			this.resp += `\n${src.name} hits ${dest.name} for ${attack.dmg} ${attack.dmgType} damage.`;

		}
		return attack;

	}

	applyHit( target, atk ) {

		if ( target.hit( atk.dmg )) {
			this.resp += `\t${target.name} was slain.`;
			if ( atk.actor ) atk.actor.addExp( lvlExp( target ) );
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

}

class Attack {

	get dmgType() { return this.weap.dmgType; }
	get name() { return this._name; }

	get dmg() { return this._dmg; }

	constructor( actor ) {

		this.actor = actor;
		this.weap = this.getWeapon( actor );

		this._name = this.weap.name;

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