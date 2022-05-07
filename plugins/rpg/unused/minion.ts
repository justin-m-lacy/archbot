let templates = require('../data/minions.json');

export default class Minion {

	/**
	 * Retrieves a minion template by name.
	 * @param {string} s 
	 */
	static GetTemplate(s: string) { return templates[s]; }

	static FromJSON(json: any) {
	}

	toJSON() {
	}

	private _name: string = '';
	private _template: string = '';
	private _hp: number = 0;

	get name() { return this._name; }
	set name(v) { this._name = v; }

	get template() { return this._template; }
	set template(v) { this._template = v; }

	get hp() { return this._hp; }
	set hp(v) { this._hp = v; }

	constructor() {
	}

}