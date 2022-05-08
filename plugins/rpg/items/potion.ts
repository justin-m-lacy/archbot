import { Item, ItemType } from './item';
import Char from '../char/char';
import { Formula } from 'formulic';

const effects = require('../magic/effects');

export default class Potion extends Item {

	static FromJSON(json: any) {

		let p = new Potion();

		if (json.effect) p.effect = json.effect;
		if (json.form) p.form = json.form;

		Item.FromJSON(json, p);

		return p;

	}

	toJSON() {

		let s = super.toJSON();

		//if (this._spell) s.spell = this._spell;
		if (this._effect) s.effect = this._effect;
		if (this._form) s.form = this._form;

		return s;

	}

	get form() { return this._form; }
	set form(v) { this._form = v; }

	get effect() { return this._effect; }
	set effect(v) { this._effect = v; }

	/*get spell() { return this._spell; }
	set spell(v) { this._spell = v; }
	_spell?: Spell;*/

	_form?: Formula | string;

	_effect?: any;

	constructor() {
		super('', '', ItemType.Potion);
	}

	quaff(char: Char) {

		if (this._form) {

			if (typeof this._form === 'string') {
				const f = Formula.TryParse(this._form);
				if (f !== false) this._form = f;
			}
			if (this._form instanceof Formula) {
				this._form.eval(char);
			}

		} else if (this._effect) {

			if (typeof (this._effect) === 'string') {

				let e = effects.getEffect(this._effect);
				if (!e) {
					console.log('effect not found: ' + this._effect);
					return;
				}

				console.log('adding potion effect.');
				char.addEffect(e);

			} else if (this._effect instanceof effects.Effect) char.addEffect(this._effect);

		}

	}

}