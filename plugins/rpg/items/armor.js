const Item = require( './item.js');

module.exports = class Armor extends Item.Item {

	get armor() {return this._armor; }
	set armor(v) { if ( v < 0 ) v = 0; this._armor = v; }

	get slot() { return this._slot; }
	set slot(v) { this._slot = v; }

	//name only
	get material() { return this._material; }
	set material(m) { this._material = m; }

	/**
	 * From template data.
	 * @param {*} base 
	 * @param {*} material 
	 */
	static FromData( base, material ) {

		let name = material.name + ' ' + base.name;
		let armor = new Armor( name );

		armor.material = material.name;
		armor.cost = material.priceMod ? base.cost*material.priceMod : base.cost;

		armor.armor = material.bonus ? base.armor + material.bonus : base.armor;
		armor.slot = base.slot;		

		return armor;
	}

	static FromJSON( json) {
		return Item.Item.FromJSON( new Armor(), json );
	}

	toJSON() {

		let json = super.toJSON();

		json.armor = this._armor;
		json.slot = this._slot;
		json.material = this._material;

		return json;

	}

	constructor( name, desc ) {

		super( name, desc, 'armor' );
		this._armor = 0;

	}

	getDetails() {
		return this._name + '\t armor: ' + this.armor + '\t price: ' + this.cost + '\n' + super.getDetails();
	}


}