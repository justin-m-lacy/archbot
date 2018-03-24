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
			if ( attack.dmg <= 0 ) attack.dmg = 1;

			this.resp += `\n${src.name} hits ${dest.name} for ${attack.dmg} ${attack.weap.dmgType} damage.`;

		}
		return attack;

	}

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

	/**
	 * single player attack. no reprisal.
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

	applyHit( char, atk ) {

		if ( char.hit( atk.dmg )) {
			this.resp += `\n${char.name} has been slain.`;
			if ( atk.char ) atk.char.addExp( char.level*10 );
		}

	}

	getAttack( char ) {
		return new Attack( char, this.getWeapon(char) );
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

	constructor( attacker, weap ) {

		this.char = attacker;
		this.weap = weap;
		this.hitroll = attacker.skillRoll() + attacker.getModifier('dex') + weap.toHit;

	}

}