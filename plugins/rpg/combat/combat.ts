import Char from '../char/char';
import World from '../world/world';
import Party from '../social/party';
import Actor from '../char/actor';
import Weapon from '../items/weapon';
import Monster from '../monster/monster';
import { Loot } from './loot';
import * as forms from '../formulas';
import { ItemIndex } from '../items/container';
import Grave from '../items/grave';
import { Item } from '../items/item';
import { ItemPicker } from '../inventory';

const itemgen = require('./items/itemgen');
const dice = require('./dice.js');

const fist = new Weapon('fists',
	new forms.DamageSrc(new dice.Roller(1, 2, 0), 'blunt'),
	'Just plain fists.');

/**
 * Exp for killing target.
 * @param {number} lvl
 */
const npcExp = (lvl: number) => Math.floor(10 * Math.pow(1.3, lvl));
const pvpExp = (lvl: number) => Math.floor(10 * Math.pow(1.2, lvl / 2));

export default class Combat {

	getText() { return this.resp; }

	resp: string = '';
	readonly attacker: Char | Party | Monster;
	readonly defender: Char | Monster | Party;
	readonly world: World;

	readonly attacks: any[] = [];

	constructor(c1: Char | Monster, c2: Char | Monster, world: World) {

		this.attacker = c1;
		this.defender = c2;

		this.world = world;

	}

	async fightNpc() {

		const defender = this.defender as Monster;
		const attacker = this.attacker as Char;

		if (defender.state !== 'alive') {
			this.resp += `${defender.name} is already dead.`;
			return;
		}

		if (attacker instanceof Party) await this.partyAttack(attacker, defender);
		else await this.tryHit(attacker, defender);

		this.resp += '\n';
		/*if (this.attacker instanceof Party) {
			await this.tryHit(defense, await attacker.randTarget());
		}
		else*/
		await this.tryHit(defender, attacker);

		await this.resolve();

		// @ts-ignore defender may have died.
		if (defender.state === 'dead') {

			this.world.removeNpc(attacker as Char, defender);
			await this.doLoot(attacker, itemgen.genLoot(defender));

		}

	}

	/**
	 * @async
	 * @param {Party} p
	 * @param {*} targ
	 * @returns {Promise}
	 */
	async partyAttack(p: Party, targ: Char | Party | Monster) {

		let names = p.roster;
		let len = names.length;

		for (let i = 0; i < len; i++) {

			var c = await p.getChar(names[i]);
			if (!c || c.state !== 'alive') {
				if (!c) console.log('!c is true: ' + names[i]);
				else console.log('attacking state: ' + c.state);
				continue;
			}

			this.resp += '\n';
			if (targ instanceof Party) {

				var destChar = await targ.randTarget();
				if (!destChar) {
					console.warn('All opponents have 0 hp.');
					break;	// no opponents with hp left.
				}
				await this.tryHit(c, destChar, p);

			} else await this.tryHit(c, targ, p);

		}

	}

	/**
	 * @async
	 * @returns {Promise}
	 */
	async fight() {

		if ('loc' in this.attacker && 'loc' in this.defender
			&& !(this.attacker.loc.equals(this.defender.loc))) {
			this.resp += `${this.attacker.name} does not see ${this.defender.name} at their location.`;
			return;
		}
		if (await this.defender.getState() !== 'alive') {
			this.resp += `${this.defender.name} is already dead.`;
			return;
		}

		if (this.attacker instanceof Party) await this.partyAttack(this.attacker, this.defender);
		else await this.tryHit(this.attacker, this.defender);

		this.resp += '\n';

		if (this.defender instanceof Party) await this.partyAttack(this.defender, this.attacker);
		else await this.tryHit(this.defender, this.attacker);

		await this.resolve();

	}

	/**
	 * @async
	 * @returns {Promise}
	 */
	async resolve() {

		let len = this.attacks.length;
		for (let i = 0; i < len; i++) {

			var atk = this.attacks[i];
			if (atk.killed) {

				//console.log('attack kills defender.')
				atk.defender.updateState();
				this.resp += ` ${atk.defender.name} was slain.`;

				if (atk.defender instanceof Char) {

					try {
						let g = Grave.MakeGrave(atk.defender, atk.attacker);
						this.resp += await this.world.put(atk.defender, g);
					} catch (e) { console.error(e); }

				}

				if (atk.attacker instanceof Char) {

					//console.log( 'Char killed defender.');
					return this.doKill(atk.attacker, atk.defender, atk.party);

				}


			} //

		}

	}

	async tryHit(src: Actor | Monster, dest: Actor | Party | Monster, srcParty?: Party) {

		if (!src) { console.warn('tryHit() src is null'); return; }

		let d: Actor | Monster | null;
		if (dest instanceof Party) {
			d = await dest.randTarget();
		} else d = dest;

		if (!d) { console.warn('tryHit() dest is null'); return; }

		let attack = new AttackInfo(src, d, srcParty);

		this.resp += `${src.name} attacks ${dest.name} with ${attack.name}`;

		if (attack.hit) {

			this.resp += `\n${d.name} was hit for ${attack.dmg} ${attack.dmgType} damage.`;
			this.resp += ` hp: ${d.curHp}/${d.maxHp}`;

		} else this.resp += `\n${src.name} misses!`;

		this.attacks.push(attack);

	}

	async doKill(char: Char, target: Char | Monster, party: Party) {

		let lvl = target.level;

		if (target instanceof Monster) {

			if (target.evil) char.evil += -target.evil / 4;
			party ? await party.addExp(npcExp(lvl)) : char.addExp(npcExp(lvl));
			char.addHistory('slay');

		} else {

			party ? await party.addExp(pvpExp(lvl)) : char.addExp(pvpExp(lvl));
			char.evil += (-target.evil) / 2 + 1 + target.getModifier('cha');
			char.addHistory('pk');

		}

	}

	/**
	 *
	 * @param {Item|number|string} wot - optional item to try to take.
	 */
	async steal(wot?: ItemPicker) {

		const attacker = this.attacker as Actor | Monster;

		let defender: Char | Monster | undefined;

		if (this.defender instanceof Party) {
			defender = await this.defender.randChar();
			if (!defender) {
				return;
			}
		} else { defender = this.defender }

		/// Monsters always assumed to be at same location.
		if ('loc' in attacker && 'loc' in defender && !(attacker.loc.equals(defender.loc))) {
			this.resp += `${attacker.name} does not see ${defender.name} at their location.`;
			return;
		}

		let atk = attacker.skillRoll() + attacker.getModifier('dex') + attacker.getModifier('wis');
		let def = defender.skillRoll() + defender.getModifier('dex') + defender.getModifier('wis');

		if (!attacker.hasTalent('steal')) atk -= 20;

		let del = atk - def;
		if (wot) del -= 5;

		if (del > 15) {

			this.take(attacker, defender, wot, del);

		} else if (del < 5 && defender.state === 'alive') {

			this.resp += `${defender.name} catches ${attacker.name} attempting to steal.\n`;
			this.attack(defender, attacker);

		} else this.resp += `${attacker.name} failed to steal from ${defender.name}`;

	}

	/**
	 * single Char attack. no reprisal.
	 * @param {Char} src
	 * @param {Char} dest
	 */
	attack(src: Actor | Monster, dest: Actor | Monster) {

		if ('loc' in src && 'loc' in dest && !(src.loc.equals(dest.loc))) {
			this.resp += `${src.name} does not see ${dest.name} at their location.`;
			return;
		}

		this.tryHit(src, dest);
		this.resolve();

	}

	take(src: Actor | Monster, targ: Char | Monster, wot?: ItemPicker, stealRoll: number = 0) {

		let it;
		if (wot) {

			it = targ.takeItem(wot) as Item | null | undefined;
			if (!it) {
				this.resp += `${src.name} tries to rob ${targ.name}, but could not find the item they wanted.`;
				return;
			}

		} else it = targ.randItem();

		if (it) {

			let ind = src.addItem(it);
			this.resp += `${src.name} stole ${it.name} from ${targ.name}. (${ind})`;

			if (src instanceof Char) {
				src.addHistory('stolen');
				src.addExp(2 * targ.level);
			}

		} else this.resp += `${src.name} attempts to steal from ${targ.name} but their pack is empty.`;

	}

	async doLoot(dest: Char | Party, loot: Loot) {

		if (!loot.gold && (!loot.items || loot.items.length === 0)) return;

		let d: Char | Party | undefined = dest;
		if (d instanceof Party) {
			d = await d.randChar();
			if (d == null) {
				return;
			}
		}

		this.resp += '\n' + dest.name + ' loots';

		if (loot.gold) {
			d.gold += loot.gold;
			this.resp += ` ${loot.gold} gold`;
		}

		let items = loot.items;
		if (items && items.length > 0) {

			var ind = d.addItem(items);

			if (loot.gold) this.resp += ',';
			for (let i = items.length - 1; i >= 1; i--) {

				this.resp += ` ${items[i].name} (${ind + i}),`;

			}
			this.resp += ` ${items[0].name} (${ind})`;

		}

	} //loot()

}

class AttackInfo {

	get dmgType() { return this.weap?.dmgType; }

	// attack name.
	get name() { return this._name; }

	// damage done.
	get dmg() { return this._dmg; }

	// attack did hit.
	get hit() { return this._hit; }

	// defender was killed.
	get killed() { return this._killed; }

	readonly attacker: Actor | Monster;
	readonly defender: Actor | Monster;
	readonly party?: Party;
	readonly weap?: Weapon;
	readonly _name?: string;
	private _hit: boolean = false;
	private _killed: boolean = false;
	private _dmg: any;
	private hitroll: number = 0;

	constructor(attacker: Actor | Monster, defender: Actor | Monster, party?: Party) {

		this.attacker = attacker;
		this.defender = defender;

		if (party) this.party = party;

		this.weap = this.getWeapon(attacker);
		this._name = this.weap?.name;

		if (this.rollHit()) this.rollDmg();

	}

	skillRoll(act: Actor | Monster) { return dice.roll(1, 5 * (act.level + 4)); }

	rollHit() {

		if (this.weap == null) {
			return false;
		}

		this.hitroll = this.skillRoll(this.attacker) + this.attacker.toHit + this.weap.toHit;
		if (this.hitroll > this.defender.armor) {
			this._hit = true;
			return true;
		}

	}

	rollDmg() {

		let dmg = this.weap!.roll() + this.attacker.getModifier('str');
		if (dmg <= 0) dmg = 1;
		this._dmg = dmg;

		let hp = this.defender.curHp -= dmg;
		if (hp <= 0) this._killed = true;
	}

	getWeapon(char: Actor | Monster) {

		let w = char.getWeapons();
		if (!w) return fist;
		else if (Array.isArray(w)) {
			return w[Math.floor(w.length * Math.random())];
		} else {
			return w;
		}

	}

}