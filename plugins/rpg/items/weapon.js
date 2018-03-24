const Item = require( './item.js');
const DamageSrc = require( '../damage.js').DamageSrc;

module.exports = class Weapon extends Item.Item {

	toJSON() {

		let json = super.toJSON();
		json.material = this._material;
		json.dmg = this.damage;
		json.hit = this.toHit;
	
		if ( this.mods ) json.mods = this.mods;

		return json;

	}

	static FromJSON( json ) {

		let w = new Weapon( json.name, json.desc );

		w.material = json.material;

		if ( json.mods ) this.mods = json.mods;

		if ( json.dmg ) {
			w.damage = DamageSrc.FromJSON( json.dmg );
		} else w.damage = new DamageSrc();

		json.hit = w.toHit;

		return Item.Item.FromJSON( json, w );

	}

	/**
	 * Create a new weapon from a base weapon object.
	 * @param {Object} tmp 
	 * @param {Material} mat 
	 */
	static FromData( tmp, mat ) {

		if ( tmp == null ) return null;

		let name = mat.name + ' ' + tmp.name;
		let w = new Weapon( name );

		w.mat = mat.name;
		w.cost = mat.priceMod ? tmp.cost*mat.priceMod : tmp.cost;

		if ( tmp.hands ) w.hands = tmp.hands;
		if ( tmp.mods ) this._mods = Object.assign( {}, tmp.mods );

		w.toHit = tmp.hit || 0;

		w.damage = DamageSrc.FromString( tmp.dmg );
		w.damage.type = tmp.type;

		if ( mat.bonus ) w.damage.bonus += mat.bonus;

		return w;

	}

	set material(m) { this._material = m;}
	get material() { return this._material; }

	get toHit() { return this._toHit; }
	set toHit(v) { this._toHit = v; }

	get bonus() { return this.damage.bonus; }
	set bonus( v ) { if ( v < 0 )v = 0; this.damage.bonus = v;}

	get mods() { return this._mods; }
	set mods(v) { this._mods = v;}

	get dmgType() { return this.damage.type;}

	constructor( name, desc ) {

		super( name, desc, 'weapon' );
		this._toHit = 0;

	}

	getDetails() {
		return this._name + '\t base damage: ' + this.damage + '\t price: ' + this.cost + '\n' + super.getDetails();
	}

	/**
	 * roll weapon damage.
	*/
	roll() { return this.damage.roll(); }


}