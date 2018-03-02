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

exports.FOREST = FOREST;
exports.TOWN = TOWN;
exports.SWAMP = SWAMP;
exports.PLAINS = PLAINS;
exports.HILLS = HILLS;
exports.MOUTANIN = MOUNTAIN;
exports.UNDER = UNDER;

const Item = require( '../items/item.js');

exports.Coord = class {

	constructor( x,y ) {
		this.x = x;
		this.y = y;
	}

	toString() {
		return this.x + ',' + this.y;
	}

}

exports.Loc = class {

	get name() { return this._name; }
	set name(v) { this._name = v;}

	get areaName() { return this._areaName; }
	set areaName(v) { this._areaName = v; }

	get biome() { return this._biome; }
	set biome(v) { this._biome = v;}

	get desc() { return this._desc; }
	set desc(v) { this._desc = v; }

	get items() { return this._items;}

	get npcs() { return this._npcs; }

	get coord() { return this._coord; }
	set coord(v) { this._coord = v; this._key = v.toString(); }

	get key() { return this._key; }

	get x() { return this._coord.x; }
	get y() { return this._coord.y; }

	constructor( coord, biomeName ) {

		this.coord = coord;
		this._biome = biomeName;

		this._name = '';
		this._areaName = '';

		this._desc = '';
		this._npcs = [];
		this._features =[];
		this._items = [];
		this._exits = {};

	}

	/**
	 * 
	 * @param {string} dir 
	 */
	getExit( dir ) {
		return this._exits[dir];
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

var reverses = { north:'south', south:'north', east:'west', west:'east', left:'right', right:'left', up:'down', down:'up' };

exports.Exit = class {

	static reverse( dir ) {
		return reverses[dir];
	}

	get dir() { return this._dir; } 

	constructor( dir ) {

		this._dir = dir;

	}

}