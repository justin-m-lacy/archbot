const Item = require( './item.js');

module.exports = class Armor extends Item {

	get armor() {return this._armor; }
	set armor(v) { this._armor = v; }

	get slot() { return this._slot; }
	set slot(v) { this._slot = v; }

	FromJSON( json) {

		return new Armor();

	}

	toJSON() {

		let json = super.toJSON();

		json.armor = this._armor;
		json.slot = this._slot;

		return json;

	}

	constructor() {

		super();
		this._armor = 0;

	}

}