const itemjs = require( './item.js');

exports.Potion = class Potion extends itemjs.Item  {

	get spell() { return this._spell; }
	set spell() { return this._spell; }

	toJSON() {

		let s = super.toJSON();

		s.spell = this._spell;

		return s;

	}

	constructor() {
		super();
	}

	quaff( char ) {
	}

}