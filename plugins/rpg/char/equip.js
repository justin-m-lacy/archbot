const itemjs = require( '../items/item.js');
const ItemGen = require( '../items/itemgen.js');
const Weapon = require('../items/weapon.js');

var MaxSlots = {
	"neck":3,
	"fingers":4
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
			"back":null,
			"waist":null,
			"neck":null,
			"fingers":null,
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

				list += itemjs.Item.ItemList( cur );

			} else {
				list += cur.name;
			}

		}

		return list;

	}
 
	get( slot ) {

		if ( !this.slots.hasOwnProperty(slot)) return slot + ' is not a valid equipment slot.';
		return this.slots[slot];

	}

	getWeapons() {

		let right = this.slots.right;
		let left = this.slots.left;

		if ( right === null ) return left ? ( left.type === 'weapon' ? left : null ) : null;
		else if ( left === null ) return right.type === 'weapon' ? right : null;

		if ( right.type !== 'weapon') return left.type === 'weapon' ? left : null;
		if ( left.type !== 'weapon') return right.type === 'weapon' ? right : null;

		return [left,right];

	}

	remove( it ) {

		if ( it.type === 'weapon') return this.removeWeap(it);

		let slot = it.slot;
		let cur = this.slots[slot];

		if ( cur instanceof Array ) {

			for( let i = cur.length-1; i >= 0; i-- ) {

				if ( cur[i] == it ) {
					cur.splice( i, 1);
					return true;
				}

			}

		} else {

			if ( cur == it ) {
				this.slots[slot] = null;
				return true;
			}

		}

		return false;

	}

	removeSlot( slot ) {

		if( !slot ) return null;

		let it = this.slots[slot];
		if ( !it) return null;

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
		if( slot === null || !this.slots.hasOwnProperty(slot)) return it.name + ' cannot be equipped.';

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

	removeWhere( p ) {

		let v;
		let removed = [];

		for( let k in this.slots ) {

			v = this.slots[k];
			if ( v === null || v === undefined ) continue;

			if ( v instanceof Array ) {

				for( let i = v.length-1; i >= 0; i-- ) {

					if ( p( v[i]) ) {
						removed.push( v.splice(i,1)[0] );
					}

				}

			} else if ( p(v) ) {

				this.slots[k] = null;
				removed.push(v);

			}

		}

		return removed;

	}

	forEach( func ) {

		let v;

		for( let k in this.slots ) {

			v = this.slots[k];
			if ( v instanceof Array ) {

				for( let i = v.length-1; i >= 0; i-- ) func( v[i] );

			} else func( v );

		}

	}

	* slotNames() {
		for( let k in this.slots ) yield k;
	}

	* items() {

		for( let k in this.slots ) {
			var it = this.slots[k];
			if ( it ) yield it;
		}

	}

}