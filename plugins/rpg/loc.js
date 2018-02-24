const FOREST = 'forest';
const TOWN = 'town';
const SWAMP = 'swamp'
const PLAINS = 'plains';
const HILLS = 'hills';
const MOUNTAIN = 'mountain';
const UNDER = 'underground';

const Item = require( './item.js');

exports.Loc = class {

	get name() { return this._name; }
	get specialName() { return this._specName; }

	get type() { return this._type; }

	get desc() { return this._desc; }
	get items() { return this._items;}
	get npcs() { return this._npcs; }

	get coord() { return this._coord; }
	get x() { return this._coord.slice(0, this._coord.indexOf(','));}
	get y() { return this._coord.slice( this._coord.indexOf(',')+1 ); }

	constructor( coord ) {

		this._coord = coord;
		this._name = '';
		this._specName = '';
		this._type = '';
		this._desc = '';
		this._npcs = [];
		this._items = [];

	}

	/**
	 * Returns everything seen when 'look'
	 * is used at this location.
	*/
	look() {

		let r = this._desc + '\n';

		let len = this._items.length;
		if ( len > 0 ) {
			r += 'On the ground you see:';
			for( let i = 0; i < len; i++ ) {
				r += '\n' + this._items[i].name;
			}

		}

	}

	/**
	 * 
	 * @param {Item} item 
	 */
	drop( item ) {
		this._items.push( item );
	}

	/**
	 * 
	 * @param {string} thing 
	 */
	pickup( thing ) {
	}

}