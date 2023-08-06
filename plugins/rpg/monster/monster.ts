import { Formula } from 'formulic';
import { LifeState } from '../char/actor';
import { Item } from '../items/item';
import { Biome } from '../world/loc';
import { roll } from '../dice';
import Weapon from '../items/weapon';
import {DamageSrc} from '../formulas';
import {Roller} from '../dice';
import * as stats from '../char/stats';

// var formulas to parse.
const parseVars = ['hp', 'armor', 'toHit', 'mp'];

// monster template objects.
const templates: { [name: string]: MonsterTemplate } = {};
const byLevel: (MonsterTemplate[])[] = [];

const initTemplates = async () => {

	const raw = (await import('../data/npc/monster.json')).default;

	for (let k = raw.length - 1; k >= 0; k--) {

		const t = parseTemplate(raw[k]);

		templates[t.name] = t;

		const a = byLevel[Math.floor(t.level)] ?? (byLevel[Math.floor(t.level)] = []);
		a.push(t);

	}
}
initTemplates();

function parseTemplate(json: any) {

	const t = Object.assign({}, json);

	for (let i = parseVars.length - 1; i >= 0; i--) {

		const v = parseVars[i];
		const s = t[v];
		if (typeof (s) !== 'string' || !Number.isNaN(s)) continue;

		t[v] = Roller.FromString(s);

	}
	if (t.dmg) { t.dmg = DamageSrc.FromJSON(t.dmg); }
	if (t.weap) {
		t.weap = Weapon.FromData(t.weap);
	}

	return t;

}

const create = (template: any) => {

	const m = new Monster();

	for (const k in template) {

		// roll data formulas into concrete numbers.
		var v = template[k];
		if (v instanceof Formula) {
			// @ts-ignore
			m[k] = v.eval(m);
		} else if (v instanceof Roller) {
			// @ts-ignore
			m[k] = v.roll();
		} else {
			// @ts-ignore
			m[k] = v;
		}

	} //for

	return m;

}


export type MonsterTemplate = {

	biome?: Biome;

	name: string;
	level: number;
	kind?: string;
	desc?: string;
	hp: string | number;
	toHit: number;

	curHp: number;
	maxHp: number;
	armor: number;
	evil: number;
	size: string;
	drops?: any;
	dmg?: any;
	weap?: any;

}

export default class Monster {

	static RandMonster(lvl: number, biome?: string) {

		lvl = Math.floor(lvl);

		if (biome) {

			let ind, start;
			do {

				const a = byLevel[lvl];
				if (!a || a.length === 0) continue;

				ind = start = Math.floor(a.length * Math.random());
				do {

					const mons = a[ind];
					if (!mons.biome || mons.biome === biome ||
						(Array.isArray(mons.biome) && !mons.biome.includes(biome)))
						return create(mons);
					ind = (ind + 1) % a.length;

				} while (ind !== start);

			} while (--lvl >= 0);

		}

		do {
			const a = byLevel[lvl];
			if (a && a.length > 0) return create(a[Math.floor(a.length * Math.random())]);

		} while (--lvl >= 0);

	}

	static FromJSON(json: any) {

		let m = new Monster();
		Object.assign(m, json);

		if (m.weap) m.weap = Weapon.FromJSON(m.weap);
		if (m.toHit) m.toHit = Number(m.toHit);
		return m;

	}

	toJSON() {

		let json = {
			name: this._name,
			desc: this._desc,
			level: this._level,
			maxHp: this._maxHp,
			curHp: this._curHp,
			armor: this._armor,
			toHit: this._toHit,
			state: this._state,
			drops: this._drops ?? undefined,
			evil: this._evil ?? undefined,
			kind: this._kind ?? undefined,
			dmg: this._dmg ?? undefined,
			weap: this._weap ?? undefined

		};
		return json;

	}

	get drops() { return this._drops; }
	set drops(v) { this._drops = v; }

	get template() { return this._template; }
	set template(t) { this._template = t; }

	get name() { return this._name; }
	set name(v) { this._name = v; }

	get level() { return this._level; }
	set level(v) { this._level = v; }
	get toHit() { return this._toHit; }
	set toHit(v) { this._toHit = v; }

	get evil() { return this._evil; }
	set evil(v) { this._evil = v; }

	get kind() { return this._kind; }
	set kind(v) { this._kind = v; }

	get size() { return this._size; }
	set size(v) { this._size = v; }

	get armor() { return this._armor; }
	set armor(v) { this._armor = v; }

	get curHp() { return this._curHp; }
	set curHp(v) { this._curHp = v; }
	get maxHp() { return this._maxHp; }
	set maxHp(v) { this._maxHp = v; }

	set hp(v: number) { this._curHp = this._maxHp = v; }

	get desc() { return this._desc; }
	set desc(v) { this._desc = v; }

	get dmg() { return this._dmg; }
	set dmg(v) { this._dmg = v; }

	/**
	 * Not yet implemented.
	get attacks() { return this._attacks; }
	set attacks(v) { this._attacks = v; }
	*/

	get weap() { return this._weap; }
	set weap(v) { this._weap = v; }

	get state() { return this._state; }
	set state(v) { this._state = v; }

	biome?: Biome;

	private _toHit: number;
	private _state: LifeState;
	private _kind?: string;
	private _desc?: string;

	private _curHp: number = 0;
	private _maxHp: number = 0;
	private _level: number = 0;
	private _armor: number = 0;
	private _name: string = '';
	private _evil: number = 0;
	private _size!: string;
	private _drops?: any;
	private _template?: MonsterTemplate;
	private _dmg?: any;
	private _weap?: any;
	private _attacks: any;
	private _talents?: string[];

	private _held?: Item[];

	constructor() {
		this._toHit = 0;
		this._state = 'alive';
	}

	skillRoll() { return roll(1, 5 * (this.level + 4)); }

	hasTalent(s: string) {
		return this._talents?.includes(s);
	}

	addItem(it: Item) {

		if (!this._held) this._held = [];
		this._held.push(it);
	}

	randItem() {
		if (this._held && this._held.length > 0) {
			return this.takeItem(Math.floor(Math.random() * this._held.length));
		}
		return null;
	}
	takeItem(which: number | string | Item, sub?: number | string) {

		if (this._held) {

			if (typeof which === 'string') {

				const asInt = parseInt(which);
				if (isNaN(asInt)) {
					which = which.toLowerCase();
					which = this._held.findIndex(v => v.name == which);
				} else which = asInt;


			} else if (typeof which === 'object') {
				which = this._held.indexOf(which);
			}

			if (which >= this._held.length || which < 0) {
				return null;
			}
			return this._held.splice(which)[0];


		}
		return null;

	}

	getDetails() {

		const kind = this._kind ? ` ${this._kind}` : '';
		return `level ${this._level} ${this._name} [${stats.getEvil(this._evil)}${kind}]\nhp:${this._curHp}/${this._maxHp} armor:${this._armor}\n${this._desc}`;

	}

	// combat & future compatibility.
	getModifier(stat: string) { return 0; }
	addExp(exp: number) { }
	updateState() { if (this._curHp <= 0) this._state = 'dead'; }
	// used in combat
	async getState() { return this._state; }

	getWeapons() { return this._weap; }
	getAttacks() { return this._attacks; }

	hit(dmg: number, type?: string) {

		this._curHp -= dmg;
		if (this._curHp <= 0) {
			this._state = 'dead';
			console.log('creature dead.');
			return true;
		}
		return false;

	}

	clone() { return Object.assign(new Monster(), this); }


}