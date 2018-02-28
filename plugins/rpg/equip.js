const Item = require( './items/item.js');

module.exports = class Equip {

	get armor(){ return this._armor; }
	set armor(v) { this._armor = v; }

	constructor() {

		this._maxslots = {
			"amulet":3,
			"ring":4
		};

		this._slots = {
			"head":null,
			"hands":null,
			"amulet":null,
			"ring":null,
			"chest":null,
			"shins":null,
			"feet":null,
			"left":null,
			"right":null
		};

	}

	/**
	 * @returns string list of all equipped items.
	*/
	getList() {

		let list = '';

		let cur;
		for( let slot in this._slots ) {

			list += '\n' + slot + ': ';

			cur = this._slots[slot];
			if ( cur == null ) {
				list += 'nothing'
			} else if ( cur instanceof Array ) {

				list += Item.ItemList( cur );

			} else {
				list += cur.getDesc();
			}

		}

		return list;

	}

	remove( it ) {

		let slot = it.slot;
		// is it a name? what?
		return this.removeSlot( slot );

	}

	removeSlot( slot ) {

		if( !this._slots.hasOwnProperty(slot)) return "No such slot.";

		let it = this._slots[slot];
		this._slots[slot] = null;

		return it;

	}

	/**
	 * 
	 * @param {string} slot 
	 * @param {Item} it 
	 * @returns error string if slot does not exist, null if equip
	 * successful, old item if item replaces previous.
	 */
	tryEquip( slot, it ) {

		if( !this._slots.hasOwnProperty(slot)) return "No such slot.";

		let cur = this._slots[slot];
		if ( cur instanceof Array ) {

			cur.push( it );
			if ( cur.length > this._maxslots[slot] ) {
				cur = cur.shift();
			}

		} else {

			if ( cur == null ) {
				this._slots[slot] = it;
			} else {

				if ( this._maxslots[slot] == null || this._maxslots[slot] === 1 ) {
					this._slots[slot] = it;
				} else {
					this._slots[slot] = [ cur, it ];
					cur = null;	// cur not replaced.
				}

			}

		}

		return cur;

	}

}