const Item = require( './items/item.js');
const Weapon = require( './items/weapon.js');
const Armor = require( './items/armor.js' );

module.exports = class Inventory {

	get items() { return this._items; }
	set items(v) { this._items = v;}

	static FromJSON( json ) {

		let arr = json.items;
		let len = arr.length;

		let inv = new Inventory();
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
			list += (i+1) + ') ' + this._items[i].getDesc() + '\n';
		}

		return list;

	}

	get( whichItem ) {

		let num = parseInt( whichItem );
		if ( Number.isNaN(num) ) {

			let it = this.findItem( whichItem );
			if ( it != null ) return it;
	
		} else {

			num--;
			if ( num >= 0 && num < this._items.length ) return this._items[num];

		}
		return null;

	}

	/**
	 * Attempts to remove an item by name or index.
	 * @param {number|string} which
	 * @returns The item removed, or null if none found. 
	 */
	remove( which ) {

		if ( which instanceof Item ) {

			let ind = this._items.indexOf( it );
			if ( ind >= 0 ) {
				this._items.splice( ind, 1 );
				return true;
			}
			return false;

		}

		let num = parseInt( which );
		if ( Number.isNaN(num) ) {

			which = which.toLowerCase();
			for( let i = this._items.length-1; i>= 0; i-- ) {
				if ( this._items[i].name.toLowerCase() === name ) return this._items.splice( i, 1 )[0];
			}
	
		} else {

			num--
			if ( num >= 0 && num < this._items.length ) return this._items.splice( num, 1 )[0];

		}
		return null;

	}

	findItem( name ) {

		name = name.toLowerCase();
		for( let i = this._items.length-1; i>= 0; i-- ) {
			if ( this._items[i].name.toLowerCase() === name ) return this._items[i];
		}
		return null;
	}

	/**
	 * 
	 * @param {Item} it 
	 */
	add( it ) {
		this._items.push(it);
	}

}