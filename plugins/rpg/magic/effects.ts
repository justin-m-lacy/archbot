import { Formula } from 'formulic';
import Char from '../char/char';

// effect types. loading at bottom.
const effects: { [name: string]: Effect } = {};

const loadEffects = () => {

	let efx = require('../data/magic/effects.json');
	for (let i = efx.length - 1; i >= 0; i--) {

		var e = efx[i];
		//console.log('parsing effect: ' + e.name );
		effects[e.name] = Effect.FromJSON(e);

	} //for

}

/**
 * Effect info only. CharEffect is effect in progress.
 */
export class Effect {

	get name() { return this._name; }

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

	private readonly _name: string;
	private _mods: any;
	private _dot: any;
	private _time: any;

	constructor(props?: any) { }

	static FromJSON(json: any) {

		let e = new Effect();
		return Object.assign(e, json);

	}

	static FromData(data: any) {

		let e = new Effect();
		if (data.dot) e._dot = Formula.TryParse(data.dot);
		if (data.mods) e._mods = data.mods;

		return e;

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

export class CharEffect {

	get name() { return this._effect.name; }

	get effect() { return this._effect; }
	get mods() { return this._effect._mods; }
	get dot() { return this._effect.dot; }

	// source that created the effect.
	get source() { return this._src; }
	set source(v) { this._src = v; }

	get time() { return this._time; }

	private _effect: Effect;
	private _time: number;

	static FromJSON(json: any) {

		let e = json.effect;
		if (typeof (e) === 'string') e = effects[e];
		else e = Effect.FromJSON(e);
		if (!e) return null;

		return new CharEffect(e, json.src, json.time);
	}

	toJSON() {

		return {
			src: this._source,
			effect: this._effect.name,
			time: this._time
		};

	}

	constructor(effect: Effect, src, time?: number) {

		this._effect = effect;
		this._source = src;
		this._time = time || this._effect.time;

	}

	start(char: Char) {

		char.log(`${char.name} is affected by ${this.name}.`);

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
						if (--len > 0) s += `${k}: ${char[k]}, `;
						else s += `${k}: ${char[k]}`;
					}
					s += ' )';

				}

				char.log(s);


			}

			return (this._time <= 0);
		}
		return false;

	}

	applyMod(m, char: Char) {

		console.log('name: ' + char.name);

		for (let k in m) {

			let cur = char[k];
			if (char[k]) {
				char[k] += m[k];
				char.log(`${char.name} ${k}: ${char[k]}`);
			}

		}

	}

	removeMod(m, char: Char) {

		for (let k in m) {

			if (char[k]) {
				char[k] -= m[k];
				char.log(`${char.name} ${k}: ${char[k]}`);
			}

		}

	}

}

loadEffects();

export const getEffect = (s: string) => effects[s];
