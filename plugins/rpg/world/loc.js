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

var reverses = { north:'south', south:'north', east:'west', west:'east', left:'right', right:'left', up:'down', down:'up' };


class Coord {

	constructor( x,y ) {
		this.x = x;
		this.y = y;
	}

	equals( c ) { return c.x === this.x && c.y === this.y; }

	toString() {
		return this.x + ',' + this.y;
	}

}
exports.Coord = Coord;

exports.Loc = class Loc {

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

	get exits() { return this._exits;}
	set exits(v) { this._exits = v;}

	get key() { return this._key; }

	get x() { return this._coord.x; }
	get y() { return this._coord.y; }

	static FromJSON( json ) {

		let loc = new Loc( new Coord(json.coord.x, json.coord.y), json.biome );

		if ( json.exits ) Object.assign( loc._exits, json.exits );
		if ( json.items ) Object.assign( loc.items, json.items )

		loc.name = json.name;
		loc.desc = json.desc;
		loc.areaName = json.areaName;

		return loc;

	}

	toJSON() {
		return {
			coord:this._coord,
			exits:this._exits,
			items:this._items,
			desc:this._desc,
			areaName:this._areaName,
			name:this._name,
			biome:this._biome
		};
	}

	/**
	 * 
	 * @param {Loc.Coord} coord 
	 * @param {string} biomeName 
	 */
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

	hasExit( dir ) {
		return this._exits.hasOwnProperty(dir);
	}

	/**
	 * Add a new exit from this location.
	 * @param {Exit} exit 
	 */
	addExit( exit ) {
		console.log( 'adding exit ' + exit);
		this._exits[exit.dir] = exit;
	}

	/**
	 * 
	 * @param {string} dir 
	 */
	getExit( dir ) {
		return this._exits[dir];
	}

	/**
	 * Returns the exit that leads back from the given direction.
	 * e.g. fromDir == 'west' returns the 'east' exit, if it exists.
	 * @param {*} fromDir - direction arriving from.
	 * @returns {Exit|null}
	 */
	reverseExit( fromDir ) {
		return this._exits[ reverses[fromDir] ];
	}

	/**
	 * Returns exit leading to coord, or null
	 * if none exists.
	 * @param {Coord} coord
	 * @returns {Exit|null}
	 */
	getExitTo( coord ) {

		for( let k in this._exits ) {
			var e = this._exits[k];
			if ( coord.equals( e.coord ) ) return e;
		}
		return null;

	}

	/**
	 * Returns everything seen when 'look'
	 * is used at this location.
	*/
	look() {

		let r = 'You are' + in_prefix[this._biome] + this._biome + '.';
		r += '\nCoord: ' + this._coord.toString() + '\n';
		r += this._desc + '\n';

		let len = this._items.length;
		if ( len > 0 ) {
			r += 'On the ground you see:';
			for( let i = 0; i < len; i++ ) {
				r += '\n' + this._items[i].name;
			}

		}

		r += '\nExits:'
		for( let k in this._exits ) {
			r += ' \t' + k;
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

class Exit {

	static Reverse( dir ) {
		return reverses[dir];
	}

	/**
	 * When moving from the source coordinate in then given direction,
	 * creates an exit moving TO the source coordinate, in the
	 * opposite direction.
	 * @param {*} srcCoord 
	 * @param {*} dir 
	 */
	static MakeReverse( srcCoord, dir ) {

		let rev = reverses[ dir ] || 'unknown';
		return new Exit( rev, srcCoord );

	}

	constructor( dir, toCoord ) {

		this.dir = dir;
		this.coord = toCoord;

	}

	toString() {
		return 'exit ' + this.dir + ' to ' + this.coord;
	}

}
exports.Exit = Exit;	// for code-hinting.