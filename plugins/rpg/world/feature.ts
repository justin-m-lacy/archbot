import Char from '../char/char';
import { Item, ItemType } from '../items/item';
const acts = require('../magic/action');

export default class Feature extends Item {

	get action() { return this._action; }
	set action(v) { this._action = v; }

	get fb() { return this._fb; }
	set fb(b) { this._fb = b; }

	/**
	 * feedback when using item.
	 */
	private _fb?: string;

	static FromJSON(json: any) {

		let f = new Feature(json.name, json.desc);

		if (json.action) {
			f.action = acts.GetAction(json.action);
		}
		if (json.fb) f.fb = json.fb;

		return Item.FromJSON(json, f);

	}

	toJSON() {

		let ob = super.toJSON();

		if (this.action) ob.action = this.action.name;
		if (this.fb) ob.fb = this.fb;

		return ob;

	}

	_action?: any;

	constructor(name: string, desc: string) {
		super(name, desc, ItemType.Feature);
	}

	use(char: Char) {

		let res = '';
		if (this._fb) {
			res += this._fb.replace('%c', char.name) + ' ';
		}

		if (this._action) {
			return res + this._action.tryApply(char);
		}
		return res + "Nothing happens.";

	}

}