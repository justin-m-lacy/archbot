const Weapon = require( './items/weapon.js');
const forms = require( './formulas.js');
const Char = require( './char/char.js');
const Monster = require( './monster/monster.js');
const itemgen = require( './items/itemgen.js');
const dice = require( './dice.js');
const Party = require( './party.js');
const effects = require( './effects.js');

const fist = new Weapon( 'fists', 'Just plain fists.');
fist.damage = new forms.DamageSrc( new dice.Roller(1,2,0), 'blunt');


/**
 * Exp for killing target.
 * @param {number} lvl 
 */
const npcExp = lvl => Math.floor( 10* Math.pow( 1.3, lvl ) );
const pvpExp = lvl =>  Math.floor( 10* Math.pow( 1.2, lvl/2 ) );

module.exports = class Combat {

	getText() { return this.resp; }

	constructor( c1, c2, world ) {

		this.attacker = c1;
		this.defender = c2;

		this.world = world;

		this.resp = '';

		this.attacks = [];

	}

	async fightNpc() {

		if ( this.defender.state !== 'alive') {
			this.resp += `${this.defender.name} is already dead.`;
			return;
		}

		if ( this.attacker instanceof Party ) await this.partyAttack( this.attacker, this.defender );
		else await this.tryHit( this.attacker, this.defender );

		this.resp += '\n';
		if ( this.attacker instanceof Party ) {
			await this.tryHit( this.defender, await this.attacker.randTarget() );
		} else await this.tryHit( this.defender, this.attacker );

		await this.resolve();

		if ( this.defender.state === 'dead') {
	
			this.world.removeNpc( this.attacker, this.defender );
			await this.doLoot( this.attacker, itemgen.genLoot( this.defender ) );

		}

	}

	async partyAttack( p, dest ) {

		let destParty = dest instanceof Party;

		let names = p.names;
		let len = names.length;

		for( let i = 0; i < len; i++ ) {

			var c = await p.getChar( names[i]);
			if ( !c || c.state !== 'alive' ) {
				if ( !c) console.log('!c is true: ' + names[i]);
				else console.log( 'attacking state: ' + c.state );
				continue;
			}

			console.log( 'ATTACK ATTEMPT: '+ names[i]);

			this.resp += '\n';
			if ( destParty ) {

				var destChar = dest.randTarget();
				if ( !destChar ) {
					console.log( 'WARNING: all opponents have 0 hp.');
					break;	// no opponents with hp left.
				}
				await this.tryHit( c, destChar, p );
	
			} else await this.tryHit( c ,dest, p );

		}

	}

	async fight() {

		if ( !(this.attacker.loc.equals(this.defender.loc)) ) {
			this.resp += `${this.attacker.name} does not see ${this.defender.name} at their location.`;
			return;
		}
		if ( await this.defender.getState() !== 'alive') {
			this.resp += `${this.defender.name} is already dead.`;
			return;
		}

		if ( this.attacker instanceof Party ) await this.partyAttack( this.attacker, this.defender );
		else await this.tryHit( this.attacker, this.defender );

		this.resp += '\n';

		if ( this.defender instanceof Party ) await this.partyAttack( this.defender, this.attacker );
		else await this.tryHit( this.defender, this.attacker );

		await this.resolve();
	
	}

	async resolve() {

		let len = this.attacks.length;
		for( let i = 0; i < len; i++ ) {

			var atk = this.attacks[i];
			if ( atk.killed ) {

				console.log('attack kills defender.')
				atk.defender.updateState();
				this.resp += ` ${atk.defender.name} was slain.`;

				if ( atk.attacker instanceof Char ) {

					console.log( 'Char killed defender.');
					return this.doKill( atk.attacker, atk.defender, atk.party );

				}


			} //

		}

	}

	async tryHit( src, dest, srcParty ) {

		if ( !src ) {console.log( 'tryHit() src is null'); return; }
		if ( dest instanceof Party ) dest = await dest.randTarget();
		if ( !dest ) { console.log( 'tryHit() dest is null'); return; }

		let attack = new AttackInfo( src, dest, srcParty );

		this.resp += `${src.name} attacks ${dest.name} with ${attack.name}`;

		if ( attack.hit ) {

			this.resp += `\n${dest.name} was hit for ${attack.dmg} ${attack.dmgType} damage.`;
			this.resp += ` hp: ${dest.curHp}/${dest.maxHp}`;

		} else this.resp += `\n${src.name} misses!`;

		this.attacks.push( attack );

	}

	async doKill( char, target, party ) {

		let lvl = target.level;

		if ( target instanceof Monster ) {

			if ( target.evil ) char.evil += -target.evil/4;
			party ? await party.addExp( npcExp(lvl) ) : char.addExp( npcExp( lvl ) );
			char.addHistory( 'slay' );

		} else {

			party? await party.addExp(pvpExp(lvl) ) : char.addExp( pvpExp(lvl ) );
			char.evil += ( -target.evil )/2 + 1 + target.getModifier( 'cha');
			char.addHistory( 'pk');

		}

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

		} else this.resp += `${this.attacker.name} failed to steal from ${this.defender.name}`;

	}

	/**
	 * single Char attack. no reprisal.
	 * @param {Char} src 
	 * @param {Char} dest 
	 */
	attack( src, dest ) {

		if ( !(src.loc.equals(dest.loc)) ) {
			this.resp += `${src.name} does not see ${dest.name} at their location.`;
			return;
		}

		let atk1 = this.tryHit( src, dest );
		this.resolve();

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

			let ind = src.addItem( it );
			this.resp += `${src.name} stole ${it.name} from ${targ.name}. (${ind})`;

			src.addHistory( 'stolen');
			src.addExp( 2*targ.level );

		} else this.resp += `${src.name} attempts to steal from ${targ.name} but their pack is empty.`;

	}

	async doLoot( dest, loot ) {

		if ( !loot.gold && loot.items.length === 0 ) return;

		if ( dest instanceof Party ) dest = await dest.randChar();

		this.resp += '\n' + dest.name + ' loots';

		if ( loot.gold ) {
			dest.gold += loot.gold;
			this.resp += ` ${loot.gold} gold`;
		}

		let items = loot.items;
		if ( items && items.length > 0 ) {

			var ind = dest.addItem( items );

			if ( loot.gold ) this.resp += ',';
			for( let i = items.length-1; i >= 1; i-- ) {

				this.resp += ` ${items[i].name} (${ind+i}),`;

			}
			this.resp += ` ${items[0].name} (${ind})`;

		}

	} //loot()

}

class AttackInfo {

	get dmgType() { return this.weap.dmgType; }

	// attack name.
	get name() { return this._name; }

	// damage done.
	get dmg() { return this._dmg; }

	// attack did hit.
	get hit() { return this._hit; }

	// defender was killed.
	get killed() { return this._killed; }

	constructor( attacker, defender, party ) {

		this.attacker = attacker;
		this.defender = defender;

		if ( party ) this.party = party;

		this.weap = this.getWeapon( attacker );
		this._name = this.weap.name;

		if  ( this.rollHit() ) this.rollDmg();

	}

	skillRoll( act ) { return dice.roll( 1, 5*( act.level+4) ) ;}

	rollHit() {

		this.hitroll = this.skillRoll( this.attacker ) + this.attacker.toHit + this.weap.toHit;
		if ( this.hitroll > this.defender.armor ) {
			this._hit = true;
			return true;
		}

	}

	rollDmg() {

		let dmg = this.weap.roll() + this.attacker.getModifier('str' );
		if ( dmg <= 0 ) dmg = 1;
		this._dmg = dmg;

		let hp = this.defender.curHp -= dmg;
		if ( hp <= 0 ) this._killed = true;
	}

	getWeapon(char ) {

		let w = char.getWeapons();
		if ( !w ) return fist;
		else if ( w instanceof Array ) {
			return w[Math.floor( w.length*Math.random() )];
		} else {
			return w;
		}

	}

}

class Attack {

	static FromJSON(json) {
	}

	toJSON() {
	}

	// stat mod to add to hit roll.
	get hitStat(){ return this._hitStat; }
	set hitStat(v) { this._hitStat = v; } 

	// stat to add to dmg roll.
	get dmgStat(){ return this._dmgStat; }
	set dmgStat( v ) { this._dmgStat = v; }

	get effect() { return this._effect; }

	// hp by default.
	get targetStat(){}

	get saveStat() {}

	constructor() {}

	rollHit() {
	}

	rollDmg() {
	}

	applyHit( actor, target ) {

		let e = this._effect;
		if ( e instanceof Array ) {

			for( i = e.length-1; i >= 0; i-- ) {
				target.effects.push( new effects.CharEffect( e[i]), 0 );
			}

		} else {
			target.effects.push( new effects.CharEffect(e,0) );
		}

	}

}