const Item = require( './items/item.js');
const Weapon = require( './items/weapon.js');
const Armor = require( './items/armor.json' );

module.exports = class Inventory {

	get items() { return this._items; }
	set items(v) { this._items = v;}

	FromJSON( json ) {

		let inv = new Inventory();

		let arr = json.items;
		let len = arr.length;

		let items = inv.items;

		for( let i = 0; i < len; i++ ) {

			items.push( Item.FromJSON( arr[i] ) );

		}

		return inv;

	}

	constructor() {

		this._items = [];

	}

	toJSON() {
		return { items:this._items };
	}

	/**
	 * @returns string list of all items in inventory.
	*/
	getList() {

		let list = '';
		let len = this._items.length;
		if ( len === 0 ) return "Nothing in inventory.";

		for( let i = 0; i < len; i++ ) {
			list += i + ') ' + this._items[i].getDesc() + '\n';
		}

		return list;

	}

	/**
	 * 
	 * @param {Item} it 
	 */
	add( it ) {
		this._items.push(it);
	}

	/**
	 * 
	 * @param {Item} it 
	 */
	remove( it ) {

		let ind = this._items.indexOf( it );
		if ( ind >= 0 ) {
			this._items.splice( ind, 1 );
			return true;
		}
		return false;

	}

}