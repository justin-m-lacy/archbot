import { Formula } from 'formulic';
import Char from '../char/char';
import Actor from '../char/actor';
import { StatMod, StatName, StatKey } from '../char/stats';

// effect types. loading at bottom.
const effects: { [name: string]: ProtoEffect } = {};

const loadEffects = () => {

	let efx = require('../data/magic/effects.json');
	for (let i = efx.length - 1; i >= 0; i--) {

		var e = efx[i];
		//console.log('parsing effect: ' + e.name );
		effects[e.name] = new ProtoEffect(e);

	} //for

}

/**
 * Effect info only. Effect is effect in progress.
 */
export class ProtoEffect {

	get mods() { return this._mods; }
	set mods(v) { this._mods = v; }

	get dot() {

		// convert to form before return.
		if (typeof (this._dot) === 'string') {
			this._dot = Formula.TryParse(this._dot);
			return this._dot;
		}
		return this._dot;

	}

	set dot(v) { this._dot = v; }

	get time() { return this._time; }
	set time(v) { this._time = v; }

	readonly name: string;
	private _mods: any;
	private _dot: any;
	private _time: any;

	constructor(data: any) {

		this.name = data.name;
		if (data.dot) this._dot = Formula.TryParse(data.dot);
		if (data.mods) this._mods = data.mods;
		this._time = data.time ?? 0;

	}

	toJSON() {

		let o = {
			mods: this._mods,
			dot: this._dot,			// formulas have toJSON()?
			time: this._time
		};

		return o;
	}

}

export class Effect {

	get name() { return this._effect.name; }

	get effect() { return this._effect; }
	get mods() { return this._effect.mods; }
	get dot() { return this._effect.dot; }

	get time() { return this._time; }

	private _effect: ProtoEffect;
	private _time: number;
	// source that created the effect.
	private readonly source?: string;

	static FromJSON(json: any) {

		let e = json.effect;
		if (typeof (e) === 'string') e = effects[e];
		else e = new ProtoEffect(e);
		if (!e) return null;

		return new Effect(e, json.src, json.time);
	}

	toJSON() {

		return {
			src: this.source,
			effect: this._effect.name,
			time: this._time
		};

	}

	constructor(effect: ProtoEffect, time?: number, src?: any) {

		this._effect = effect;
		this.source = src;
		this._time = time || this._effect.time;

	}

	start(char: Actor) {


		if (char instanceof Char) {
			char.log(`${char.name} is affected by ${this.name}.`);
		}

		if (this.mods) {
			console.log('apply mods');
			this.applyMod(this.mods, char);
		};

	}

	end(char: Char) {

		char.log(`${char.name} ${this.name} has worn off.`);
		if (this.mods) {
			this.removeMod(this.mods, char);
		};

	}

	/**
	 * 
	 * @param {Actor} char
	 * @returns {bool} true if effect complete. 
	 */
	tick(char: Char) {

		if (this._time) {
			this._time--;

			let v = this.dot;
			if (v) {

				let s = `${char.name} affected by ${this.name}.`;
				v.eval(char);

				let len = v.setProps.size;
				if (len > 0) {

					s += ' ( ';
					for (let k of v.setProps.keys()) {
						if (--len > 0) s += `${k}: ${char[k as keyof Char]}, `;
						else s += `${k}: ${char[k as keyof Char]}`;
					}
					s += ' )';

				}

				char.log(s);


			}

			return (this._time <= 0);
		}
		return false;

	}

	applyMod(m: StatMod, char: Actor) {

		console.log('name: ' + char.name);

		for (let k in m) {

			let cur = char[k as keyof (typeof char)];
			if (cur) {
				char[k as StatName] = cur + m[k as StatName];
				if (char instanceof Char) {
					char.log(`${char.name} ${k}: ${char[k as keyof (typeof char)]}`);
				}
			}

		}

	}

	removeMod(m: StatMod, char: Actor) {

		for (let k in m) {

			if (char[k as keyof Actor]) {
				char[k as StatName] -= m[k as StatName] ?? 0;
				if (char instanceof Char) {
					char.log(`${char.name} ${k}: ${char[k as keyof Char]}`);
				}
			}

		}

	}

}

loadEffects();

export const getEffect = (s: string) => effects[s];
