const itemjs = require( './items/item.js');
const ItemGen = require( './items/itemgen.js');

module.exports = class Inventory {

	get items() { return this._items; }
	set items(v) { this._items = v;}

	get length() { return this._items.length; }

	static FromJSON( json ) {

		let arr = json.items;
		let len = arr.length;

		let inv = new Inventory();
		let items = inv.items;

		for( let i = 0; i < len; i++ ) {

			var it = ItemGen.fromJSON( arr[i]);
			if ( it ) items.push( it );

		}

		return inv;

	}

	constructor() {
		this._items = [];
	}

	toJSON() {
		return { items:this._items };
	}

	randItem() {

		let len = this._items.length;
		if ( len === 0 ) return null;

		let ind = Math.floor( len*Math.random() );
		return this._items.splice( ind, 1 )[0];

	}

	getList() {
		return itemjs.Item.ItemList( this._items );
	}

	/**
	 * @returns string list of all items in inventory.
	*/
	getMenu() {

		let len = this._items.length;
		if ( len === 0 ) return '';

		let it = this._items[0];
		let list = '1) ' + it.name;
		if ( it.attach ) list += '\t[img]';

		for( let i = 1; i < len; i++ ) {
			it = this._items[i];
			list += '\n'+(i+1) + ') ' + it.name;
			if ( it.attach ) list += '\t[img]';
	
		}

		return list;

	}

	/**
	 * Retrieves an item by name or index.
	 * @param {<string>|<number>} wot
	 * @returns Item found, or null on failure.
	 */
	get( wot ) {

		if ( !wot ) return null;

		let num = parseInt( wot );
		if ( Number.isNaN(num) ) {

			let it = this.findItem( wot );
			if ( it != null ) return it;
	
		} else {

			num--;
			if ( num >= 0 && num < this._items.length ) return this._items[num];

		}
		return null;

	}

	takeRange( start, finish ) {

		if ( isNaN(start) || isNaN(finish)) return null;

		if ( --start < 0) start = 0;
		if ( finish > this._items.length ) { finish = this._items.length; }

		return this._items.splice( start, finish-start );

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

			var it = this._items[i];
			if ( it && it.name && it.name.toLowerCase() === name ) return this._items[i];

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
		return this._items.length;

	}

	/**
	 * Remove all items matching predicate; returns the list of items removed.
	 * @param {*} p 
	 */
	removeWhere( p ) {

		let r = [];

		for( let i = this._items.length-1; i >= 0; i-- ) {
			if ( p(this._items[i])) r.push( this._items.splice(i,1)[0] );
		}

		return r;

	}

	/**
	 * Apply function to each item in inventory.
	 * @param {function} f 
	 */
	forEach( f ) {

		for( let i = this._items.length-1; i >= 0; i-- ) {
			f( this._items[i]);
		}

	}

}