const itemjs = require( './items/item.js');
const ItemGen = require( './items/itemgen.js');

module.exports = class Inventory {

	get items() { return this._items; }
	set items(v) { this._items = v;}

	static FromJSON( json ) {

		let arr = json.items;
		let len = arr.length;

		let inv = new Inventory();
		let items = inv.items;

		for( let i = 0; i < len; i++ ) {

			var it = ItemGen.fromJSON( arr[i]);
			if ( it != null ) items.push( ItemGen.fromJSON( it ) );

		}

		return inv;

	}

	constructor() {
		this._items = [];
	}

	toJSON() {
		return { items:this._items };
	}

	getList() {
		return itemjs.Item.ItemList( this._items );
	}

	/**
	 * @returns string list of all items in inventory.
	*/
	getMenu() {

		let list = '';
		let len = this._items.length;
		if ( len === 0 ) return '';

		for( let i = 0; i < len; i++ ) {
			list += (i+1) + ') ' + this._items[i].name + '\n';
		}

		return list;

	}

	/**
	 * Retrieves an item by name or index.
	 * @param {<string>|<number>} whichItem
	 * @returns Item found, or null on failure.
	 */
	get( whichItem ) {

		if ( whichItem == null) return null;

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
	 * @param {number|string|Item} which
	 * @returns The item removed, or null if none found. 
	 */
	remove( which ) {

		if ( which == null ) return null;
		if ( which instanceof itemjs.Item ) {

			let ind = this._items.indexOf( which );
			if ( ind >= 0 ) return this._items.splice( ind, 1 )[0];
			return null;

		}

		let num = parseInt( which );
		if ( Number.isNaN(num) ) {

			which = which.toLowerCase();
			for( let i = this._items.length-1; i>= 0; i-- ) {
				var item = this._items[i];
				if ( item == null ) continue;
				if ( item.name.toLowerCase() === which ) return this._items.splice( i, 1 )[0];
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

		if ( it instanceof Array ) this._items = this._items.concat( it );
		else this._items.push(it);
	}

	cook( it ) {

		let cooking = require( './data/cooking.json' );
		let adjs = cooking.adjectives;

		let adj = adjs[ Math.floor( adjs.length*Math.random() )];

		if ( it.type == itemjs.ARMOR ) {
			it.armor -= 10;
		} else if ( it.type == itemjs.WEAPON ) {
			it.bonus -= 10;
		}
		it.type = itemjs.FOOD;

		it.name = adj + ' ' + it.name;

	}

}