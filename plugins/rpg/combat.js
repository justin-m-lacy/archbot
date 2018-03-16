const Weapon = require( './items/weapon.js');
const dmg = require( './damage.js');
const dice = require( './dice.js');

const fist = new Weapon( 'fists', 'Just plain fists.');
fist.damage = new dmg.DamageSrc( 1, 2, 0, 'blunt');


module.exports = class Combat {

	getText() { return this.resp; }

	constructor( c1, c2, world ) {

		this.attacker = c1;
		this.defender = c2;
		this.world = world;

		this.resp = '';

	}

	tryHit( src, dest ) {

		let attack = this.getAttack(src );

		this.resp += `${src.name} attacks ${dest.name} with ${attack.weap.name}`;

		if ( attack.hitroll < dest.armor ) {
			this.resp += `\n${src.name} misses!`;
		} else {

			attack.dmg = attack.weap.roll() + src.getModifier('str');
			this.resp += `\n${src.name} hits ${dest.name} for ${attack.dmg} ${attack.weap.damageType} damage.`;

		}
		return attack;

	}

	fight() {

		if ( !(this.attacker.loc.equals(this.defender.loc)) ) {

			this.resp += `${this.attacker.name} does not see ${this.defender.name} at their location.`;
			return;
		}
	
		let atk1 = this.tryHit( this.attacker, this.defender );
		this.resp += '\n';
		let atk2 = this.tryHit( this.defender, this.attacker );

		if ( atk1.dmg ) this.applyHit( this.defender, atk1 );
		if ( atk2.dmg ) this.applyHit( this.attacker, atk2 );
	
	}

	applyHit( char, atk ) {

		if ( char.hit( atk.dmg )) {
			this.resp += `\n${char.name} has been slain.`;
		}

	}

	getAttack( char ) {
		return new Attack( this.getWeapon(char), dice.roll(1,20,char.getModifier('dex')) );
	}

	getWeapon(char ) {

		let weaps = char.getWeapons();
		if ( weaps === null ) return fist;
		else if ( weaps instanceof Array ) {
			return weaps[Math.floor(weaps.length*Math.random() )];
		} else {
			return weaps;
		}

	}

}

class Attack {

	constructor( weap, hitroll ) {

		this.weap = weap;
		this.hitroll = hitroll;

	}

}