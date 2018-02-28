const Item = require( './item.js');
const dice = require ( '../dice.js');

//weap templates.
var templates;
var byName;

module.exports = class Weapon extends Item {

	static LoadTemplates() {

		templates = require( '../data/weapons.json' );

	}

	toJSON() {

		let json = super.toJSON();
		json.material = this._material;

		return json;

	}

	static FromJSON( json ) {

		let w = new Weapon( null, json.material );

		return w;

	}

	set material(m) { this._material = m;}
	get material() { return this._material; }


	constructor( template, material ) {

		super();

		if ( template != null ) {

			if ( template.dmg != null ) {

				this.damage = dice.Roller.FromString( template.dmg);
				delete template.dmg;

			} else this.damage = new dice.Roller();
	

			for( k in template ) {
				this[k] = template[k];
			}

		}

		this._material = material;

	}

	/**
	 * roll weapon damage.
	*/
	roll() { return this.damage.roll(); }
}

class WTemplate {

	constructor() {
	}

}