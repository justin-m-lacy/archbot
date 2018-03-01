const WEAPON = 'weapon';
const ARMOR = 'armor';
const POTION = 'potion';
const SCROLL = 'scroll';
const UNIQUE = 'unique';
const SPECIAL = 'special';
const UNKNOWN = 'unknown';

module.exports = class Item {

	get name() { return this._name; }
	get type() { return this._type; }
	get subtype() { return this._subtype; }

	get cost() { return this._cost; }
	set cost(v) { this._cost = v;}

	get desc() { return this._desc; }
	set desc( v) { this._desc = v; }

	get inscription() { return this._inscript; }
	set inscription(v) { this._inscript = v; }

	static ItemMenu( a, start=1) {

		let len = a.length;
		if ( len == 0 ) return 'nothing';
		else if ( len == 1 ) return (start) + ') ' + a[0].getDesc();

		let res = (start++) + ') ' + a[0].getDesc();
		for( let i = 1; i < len; i++ ) {
			res += '\n' + (start++) + ') ' + a[i].getDesc();
		}

		return res;

	}

	/**
	 * 
	 * @param {Array[Item]} a 
	 */
	static ItemList( a ) {

		let len = a.length;
		if ( len == 0 ) return 'nothing';
		else if ( len == 1 ) return a[0].getDesc();

		let res = a[0].getDesc();
		for( let i = 1; i < len; i++ ) {
			res += ', ' + a[i].getDesc();
		}

		return res;

	}

	static FromJSON( json ) {
		// check type.
		let it = new Item( json.name, json.desc, json.type );
		if ( json.inscript ) it._inscript = json.inscript;

		return it;

	}

	toJSON() {

		let json = {
			name:this._name,
			desc:this._desc,
			type:this._type,
			cost:this._cost
		}

		if ( this._inscript ) json.inscrip = this._inscript;

		return json;

	}

	constructor( name, desc, type ) {

		this._name = name;
		this._type = type || UNKNOWN;
		this._desc = desc || "Nothing special.";

	}

	getDetails() { 
		return this._inscript ? this._desc + ' { ' + this._inscript + ' }' : this._desc;
	}

	/**
	 * String description of item.
	*/
	getDesc() {
		return this.name;
	}

}