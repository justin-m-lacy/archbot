const Item = require( './items/item.js');
const ItemGen = require( './items/itemgen.js');
const Weapon = require('./items/weapon.js');

var MaxSlots = {
	"amulet":3,
	"ring":4
};


module.exports = class Equip {

	static FromJSON( json ) {

		let e = new Equip();
		let src = json.slots;
		let dest = e.slots;
		if ( src == null ) return e;

		let it;
		for( let k in src ) {

			it = src[k];
			if ( it != null ) {
				dest[k] = ItemGen.fromJSON( it );
			}

		}

		return e;

	}

	constructor() {

		this.slots = {
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
		for( let slot in this.slots ) {

			list += '\n' + slot + ': ';

			cur = this.slots[slot];
			if ( cur == null ) {
				list += 'nothing'
			} else if ( cur instanceof Array ) {

				list += Item.ItemList( cur );

			} else {
				list += cur.name;
			}

		}

		return list;

	}

	remove( it ) {

		if ( it.type === 'weapon') return this.removeWeap(it);

		let slot = it.slot;
		// is it a name? what?
		return this.removeSlot( slot );

	}

	removeSlot( slot ) {

		if( !this.slots.hasOwnProperty(slot)) return null;

		let it = this.slots[slot];
		this.slots[slot] = null;

		return it;

	}

	removeWeap( it ) {

		if ( this.slots.right == it ) this.slots.right = null;
		else if ( this.slots.left == it ) this.slots.left = null;

		return it;

	}

	equipWeap( it ) {

		console.log('equipping weapon...');

		let right = this.slots.right;
		let left = this.slots.left;

		if ( it.hands === 2 ) {

			console.log( 'Setting two handed weapon.');
			this.slots.right = it;
			this.slots.left = null;

			if ( right === null ) return left;
			if ( left === null ) return right;
			return [ left, right ];

		} else {

			if ( right === null ) {

				console.log('setting right hand.');

				this.slots.right = it;
				if ( left !== null && left.hands === 2 ) {
					this.slots.left = null;
					return left;
				}

			} else if ( left === null ) {

				console.log('setting left hand.');

				this.slots.left = it;
				if ( right !== null && right.hands === 2 ) {
					this.slots.right = null;
					return right;
				}

			} else {

				console.log('passing off hands.');

				// can't both be two-handed.
				this.slots.right = it;
				this.slots.left = right;

				return left;

			}
			return null;

		}

	}

	/**
	 * 
	 * @param {string} slot 
	 * @param {Armor|Weapon} it 
	 * @returns error string if slot does not exist, null if equip
	 * successful, old item if item replaces previous.
	 */
	equip( it ) {

		if ( it.type === 'weapon' ) return this.equipWeap(it);

		let slot = it.slot;
		if( !this.slots.hasOwnProperty(slot)) return "No such slot.";

		let cur = this.slots[slot];
		if ( cur instanceof Array ) {

			cur.push( it );
			if ( cur.length > MaxSlots[slot] ) {
				cur = cur.shift();
			}

		} else {

			if ( cur == null ) {
				this.slots[slot] = it;
			} else {

				if ( MaxSlots[slot] == null || MaxSlots[slot] === 1 ) {
					this.slots[slot] = it;
				} else {
					this.slots[slot] = [ cur, it ];
					cur = null;	// cur not replaced.
				}

			}

		}

		return cur;

	}

}