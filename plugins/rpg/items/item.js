exports.WEAPON = "weapon";
exports.ARMOR = "armor";
exports.POTION = "potion";
exports.FOOD = 'food';
exports.DRINK = 'drink';
exports.SCROLL = 'scroll';
exports.UNIQUE = 'unique';

var UNKNOWN = exports.UNKNOWN = "unknown";

exports.Item = class Item {

	get name() { return this._name; }
	set name(v) { this._name = v; }

	get type() { return this._type; }
	set type(v) { this._type = v;}

	get cost() { return this._cost; }
	set cost(v) { this._cost = v;}

	get desc() { return this._desc; }
	set desc( v) { this._desc = v; }

	get inscription() { return this._inscript; }
	set inscription(v) { this._inscript = v; }

	get attach() { return this._attach; }
	set attach(v) { this._attach = v;}

	/**
	 * @returns {string} discord id of crafter.
	 */
	get crafter() { return this._crafter; }
	set crafter(s) { this._crafter = s; }

	/**
	 * Since Item should be subclassed, the sub item created
	 * is passed as a param.
	 * @param {*} json 
	 * @param {*} it 
	 */
	static FromJSON( json, it=null ) {

		if ( !it) it = new Item( json.name, json.desc, json.type );

		if ( json.cost) it._cost = json.cost;
		if ( json.attach ) it._attach = json.attach;
		if ( json.maker ) this._crafter = json.maker;
		if ( json.inscrip ) this._inscript = json.inscript;

		return it;

	}

	toJSON() {

		let json = {
			name:this._name,
			desc:this._desc,
			type:this._type,
			cost:this._cost
		}

		if ( this._attach ) json.attach = this._attach;
		if ( this._crafter ) json.maker = this._crafter;
		if ( this._inscript ) json.inscrip = this._inscript;

		return json;

	}

	constructor( name, desc, type ) {

		this._name = name;
		this._type = type || UNKNOWN;
		this._desc = desc || '';

	}

	getView() {
		return [ this.getDetails(), this._attach ];
	}

	/**
	 * @returns detailed string description of item.
	*/
	getDetails() {

		let s = this._name + ': ' + this._desc;
		if ( this._inscript ) s += ' { ' + this._inscript + ' }';
		if ( this._attach) s += ' [img]';

		return s;
	}

	static ItemMenu( a, start=1) {

		let len = a.length;
		if ( len === 0 ) return 'nothing';
		else if ( len === 1 ) return (start) + ') ' + a[0]._name;

		let res = (start++) + ') ' + a[0]._name;
		for( let i = 1; i < len; i++ ) {
			res += '\n' + (start++) + ') ' + a[i]._name;
		}

		return res;

	}

	/**
	 * 
	 * @param {Item[]} a 
	 */
	static ItemList( a ) {

		let len = a.length;
		if ( len === 0 ) return 'nothing';
		else if ( len === 1 ) return a[0]._name;

		let res = a[0]._name;
		for( let i = 1; i < len; i++ ) {
			res += ', ' + a[i]._name;
		}

		return res;

	}

	/**
	 * Returns a menu for selecting an item.
	 * @param {Item[]} a 
	 */
	static ItemMenu( a ) {

		let list = '';
		let len = a.length;
		if ( len === 0 ) return '';

		for( let i = 0; i < len; i++ ) {
			list += (i+1) + ') ' + a[i].name + '\n';
		}

		return list;

	}

	static Cook( it ) {

		let cooking = require( '../data/cooking.json' );
		let adjs = cooking.adjectives;

		let adj = adjs[ Math.floor( adjs.length*Math.random() )];

		if ( it.type === itemjs.ARMOR ) {
			it.armor -= 10;
		} else if ( it.type === itemjs.WEAPON ) {
			it.bonus -= 10;
		}
		it.type = itemjs.FOOD;

		it.name = adj + ' ' + it.name;

		let desc = cooking.descs[ Math.floor( cooking.descs.length*Math.random())];
		it.desc += ' ' + desc;

	}

}

exports.Craft = function( char, name, desc, attach ) {

	let item = new exports.Item( name, desc );

	if ( attach) item._attach = attach;

	char.addExp( 1 );
	char.addItem( item );

}