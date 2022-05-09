import Char from '../char/char';
const dice = require('../dice.js');

class Action {

	static FromJSON(json: any) {

		let a = new Action(json.name);

		Object.assign(a, json);

		return a;

	}

	toJSON() { return this; }

	private readonly name: string;
	private effects?: Effect[];

	private err?: string;

	private require?: any;

	constructor(name: string) {

		this.name = name;

	}

	tryApply(char: Char) {

		// effects with different conditions for each one.
		if (this.effects) {

			let len = this.effects.length;
			let e;
			for (let i = 0; i < len; i++) {

				e = this.effects[i];
				if (this.checkRequire(char, e.require)) {
					return this.applyEffect(char, e);
				}
				if (e.err) return e.err.replace('%c', char.name);
			}

		} else {

			if (this.checkRequire(char, this.require)) {
				return this.applyEffect(char, this);
			}

		}

		if (this.err) return this.err.replace('%c', char.name);
	}

	checkRequire(char: Char, req: any) {
		for (let k in req) {
			if (char[k as keyof Char] !== req[k]) return false;
		}
		return true;
	}

	applyEffect(char: Char, eff: any) {

		let apply = eff.apply;
		for (let k in apply) {

			var val = apply[k];
			if (typeof (val) === 'object') {

				// @ts-ignore
				if (val.roll) char[k] += dice.parseRoll(val.roll);

			} else {
				// @ts-ignore
				char[k] = val;
			}


		}

		if (eff.fb) return eff.fb.replace('%c', char.name);
		return '';

	}

}

const actions: { [name: string]: Action } = {};
const loadActions = () => {

	let data = require('../data/magic/actions.json');

	for (let k in data) {
		actions[k] = Action.FromJSON(data[k]);
	}
}
loadActions();


class Effect {

	err?: string;
	fb?: string;
	apply: any;
	require: any;

	constructor(require?: any, apply?: any, fb?: string, err?: string) {

		this.require = require;
		this.apply = apply;
		this.fb = fb;
		this.err = err;

	}

}

export const GetAction = (s: string) => {
	return actions[s];
}