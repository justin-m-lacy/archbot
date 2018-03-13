let actor = require( './actor.js');

let templates = require( '../data/minions.json' );

module.exports = class Minion {

	/**
	 * Retrieves a minion template by name.
	 * @param {string} s 
	 */
	static GetTemplate( s) { return templates[s]; }

	static FromJSON( json ) {
	}

	toJSON() {
	}

	get name() { return this._name; }
	set name(v){this._name = v; }

	get template() { return this.tmpl; }
	set template(v) { this.tmpl = v; }

	get hp() { return this._hp; }
	set hp(v) { this._hp = v; }

	constructor() {
	}

}