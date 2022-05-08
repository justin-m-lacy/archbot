import { Effect } from '../magic/effects';
import Actor from '../char/actor';
import { Formula } from 'formulic';

export class Attack {

	static FromJSON(json: any) {

		let a = new Attack();

		Object.assign(a, json);

		return a;

	}

	toJSON() {

		let o = {
		};

		return o;

	}

	get dmg() { return this._dmg; }
	set dmg(v) { this._dmg = v; }

	// stat mod to add to hit roll.
	get hitStat() { return this._hitStat; }
	set hitStat(v) { this._hitStat = v; }

	// stat to add to dmg roll.
	get dmgStat() { return this._dmgStat; }
	set dmgStat(v) { this._dmgStat = v; }

	get effect() { return this._effect; }
	set effect(v) {

		if (typeof (v) === 'string') {
			this._effect = Formula.TryParse(v);
		} else this._effect = v;

	}

	private _effect?: any;
	private _dmgStat: any;
	private _hitstat: any;
	private _dmg: any;
	private _hitStat: any;

	constructor() { }

	rollHit() {
	}

	rollDmg() {
	}

	applyHit(actor: Actor, target: Actor) {

		let e = this._effect;
		/*if (Array.isArray(e)) {

			for (i = e.length - 1; i >= 0; i--) {
				target.effects.push(new Effect(e[i]), 0);
			}

		} else {
			target.effects.push(new Effect(e, 0));
		}*/

	}

}