const FOREST = 'forest';
const TOWN = 'town';
const SWAMP = 'swamp'
const PLAINS = 'plains';
const HILLS = 'hills';
const MOUNTAIN = 'mountains';
const UNDER = 'underground';

var in_prefix = { [FOREST]:' in a ', [TOWN]:' in a ', [SWAMP]:' in a ', [PLAINS]:' on the ', [HILLS]:' in the ',
	[MOUNTAIN]:' in the ', [UNDER]:' '};

exports.Biomes = [ FOREST, TOWN, SWAMP, PLAINS, HILLS, MOUNTAIN, UNDER ];

const Item = require( './item.js');

exports.Loc = class {

	get name() { return this._name; }
	set name(v) { this._name = v;}
	get specialName() { return this._specName; }
	set specialName(v) { this._specName = v; }

	get biome() { return this._biome; }

	get desc() { return this._desc; }
	set desc(v) { this._desc = v; }

	get items() { return this._items;}

	get npcs() { return this._npcs; }

	get coord() { return this._coord; }
	get x() { return this._coord.slice(0, this._coord.indexOf(','));}
	get y() { return this._coord.slice( this._coord.indexOf(',')+1 ); }

	constructor( coord, biome ) {

		this._coord = coord;
		this._biome = biome;

		this._name = '';
		this._specName = '';

		this._desc = '';
		this._npcs = [];
		this._items = [];
		this._exits = {};

	}

	/**
	 * Returns everything seen when 'look'
	 * is used at this location.
	*/
	look() {

		let r = 'You are' + in_prefix[this._biome] + this._biome + '.';
		r += this._desc + '\n';

		let len = this._items.length;
		if ( len > 0 ) {
			r += 'On the ground you see:';
			for( let i = 0; i < len; i++ ) {
				r += '\n' + this._items[i].name;
			}

		}

		return r;

	}

	lookItems() {

		let len = this._items.length;
		if ( len > 0 ) {
			let r = 'On the ground you see:';
			for( let i = 0; i < len; i++ ) {
				r += '\n' + this._items[i].name;
			}
			return r;

		} else {
			return 'There are no items here.';
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