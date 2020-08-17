const itemjs = require( './items/item.js');
const ItemGen = require( './items/itemgen.js');

module.exports = class Inventory {

	/**
	 * @property {Item[]} items
	 */
	get items() { return this._items; }
	set items(v) { this._items = v;}

	/**
	 * @property {number} length
	 */
	get length() { return this._items.length; }

	static FromJSON( json, inv=null ) {

		let arr = json.items;
		let len = arr.length;

		if ( !inv ) inv = new Inventory();
		let items = inv.items;

		for( let i = 0; i < len; i++ ) {

			var it = ItemGen.fromJSON( arr[i]);
			if ( it ) items.push( it );
			else console.log('Inventory.js: ERR PARSING: ' + arr[i]);

		}

		return inv;

	}

	constructor() {
		this._items = [];
	}

	toJSON() { return { items:this._items }; }

	/**
	 * Removes and returns random item from inventory.
	 * @returns {Item} random item from Inventory, or null.
	 */
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
	 * @returns {string} list of all items in inventory.
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
	 * Retrieve item by name or index.
	 * @param {string|number} start
	 * @returns {Item|null} Item found, or null on failure.
	 */
	get( start, sub ) {

		if ( sub ) return this.getSub( start, sub );
		if ( !start ) return null;

		let num = parseInt( start );

		if ( Number.isNaN(num) ) {

			return this.findItem( start );

		} else {

			num--;
			if ( num >= 0 && num < this._items.length ) return this._items[num];

		}
		return null;

	}

	/**
	 * Returns an item from a sub-inventory, or a range of items
	 * if the base item is not an inventory, and the second param
	 * is a number.
	 * @param {string|number} base
	 * @param {string|number} sub
	 * @returns {Item|[Item]|null}
	 */
	getSub( base, sub ) {

		let it = this.get(base);
		if ( !it) return null;

		if ( it.type === 'chest') return it.get(sub);
		else return this.takeRange( base, sub );

	}

	/**
	 * Takes an item from a sub-inventory, or a range of items
	 * if the base item is not an inventory, and the second param
	 * is a number.
	 * @param {*} base
	 * @param {*} sub
	 * @returns {Item|[Item]|null}
	 */
	takeSub( base, sub ) {

		let it = this.take(base);
		if ( !it) return null;

		if ( it.type === 'chest') return it.take(sub);
		else return this.takeRange( base, sub );

	}

	/**
	 *
	 * @param {number} start - start number of items to take.
	 * @param {number} finish - end number of items to take.
	 * @returns {[Item]|null} - Range of items found.
	 */
	takeRange( start, finish ) {

		if ( isNaN(start) || isNaN(finish)) return null;

		if ( --start < 0) start = 0;
		if ( finish > this._items.length ) { finish = this._items.length; }

		return this._items.splice( start, finish-start );

	}

	/**
	 * Attempts to remove an item by name or index.
	 * @param {number|string|Item} which
	 * @returns {Item|null} item removed, or null if none found.
	 */
	take( which, sub ) {

		if ( sub ) return this.takeSub( which, sub );
		if ( !which ) return null;

		if ( which instanceof itemjs.Item ) {

			let ind = this._items.indexOf( which );
			if ( ind >= 0 ) return this._items.splice( ind, 1 )[0];
			return null;

		}

		let ind = parseInt( which );
		if ( Number.isNaN(ind) ) {

			which = which.toLowerCase();
			for( let i = this._items.length-1; i>= 0; i-- ) {

				var item = this._items[i];
				if ( !item ) continue;
				if ( item.name.toLowerCase() === which ) return this._items.splice( i, 1 )[0];

			}

		} else {

			ind--
			if ( ind >= 0 && ind < this._items.length ) return this._items.splice( ind, 1 )[0];

		}

		return null;

	}

	/**
	 *
	 * @param {string} name
	 */
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
	 * @param {Item|[Item]} it
	 * @returns {number} - starting 1-index where items were added.
	 */
	add( it ) {

		if ( Array.isArray( it ) ) {
			let ind = this._items.length + 1;
			this._items = this._items.concat( it );
			return ind;
		}

		this._items.push(it);
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