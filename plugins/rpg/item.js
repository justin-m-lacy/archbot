const WEAPON = 'weapon';
const ARMOR = 'armor';
const POTION = 'potion';
const SCROLL = 'scroll';
const UNIQUE = 'unique';
const SPECIAL = 'special';

module.exports = class {

	get name() { return this._name; }
	get type() { return this._type; }
	get subtype() { return this._subtype; }

	constructor( type, subtype ) {

		this._type = type;
		this._subtype = subtype;

	}

}