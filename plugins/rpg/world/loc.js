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

const Inv = require( '../inventory.js');
const Item = require( '../items/item.js');

var reverses = { enter:'exit', exit:'enter', north:'south', south:'north', east:'west', west:'east', left:'right', right:'left', up:'down', down:'up' };


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

	get npcs() { return this._npcs; }

	get coord() { return this._coord; }
	set coord(v) { this._coord = v; this._key = v.toString(); }

	get time() { return this._time; }
	set time(v) { this._time = v;}

	get exits() { return this._exits;}
	set exits(v) { this._exits = v;}

	get key() { return this._key; }

	get x() { return this._coord.x; }
	get y() { return this._coord.y; }

	get maker() { return this._maker; }
	set maker(v) { this._maker = v; }

	get owner() { return this._owner; }
	set owner(v) { this._owner = v; }

	static FromJSON( json ) {

		let loc = new Loc( new Coord(json.coord.x, json.coord.y), json.biome );

		let exits = json.exits;
		if ( exits ) {

			let e;
			for( let k in exits ) {
				e = exits[k];
				loc.addExit(
					new Exit( e.dir, new Coord(e.coord.x, e.coord.y) )
				);

			}

		}

		if ( json.inv ) {
			loc._inv = Inv.FromJSON( json.inv );
		} else if ( json.items ) {
			// legacy
			loc._inv = Inv.FromJSON( {"items":json.items});
		}

		loc.name = json.name;
		loc.desc = json.desc;
		loc.areaName = json.areaName;

		if ( json.owner ) loc._owner = json.owner;
		if ( json.maker) loc._maker = json.maker;
		if ( json.time ) loc._time = json.time;

		return loc;

	}

	toJSON() {

		let o = {
			coord:this._coord,
			exits:this._exits,
			inv:this._inv,
			desc:this._desc,
			areaName:this._areaName,
			name:this._name,
			biome:this._biome
		};

		if ( this._maker ) o.maker = this._maker;
		if ( this._time) o.time = this._time;
		if ( this._owner ) o.owner = this._owner;

		return o;
	}

	/**
	 * 
	 * @param {Loc.Coord} coord 
	 * @param {string} biomeName 
	 */
	constructor( coord, biomeName ) {

		this.coord = coord;
		this._biome = biomeName;

		this._npcs = [];
		this._features =[];
		this._inv = new Inv();
		this._exits = {};

	}

	setMaker( n ) {
		this._maker = n;
		this._time = Date.now();
	}

	explored() {

		if (!this._maker) return 'Never explored.';
		if ( this._time ) return this._maker + ' explored ' + this.coord + ' at ' + new Date( this._time ).toLocaleDateString();
		return this._maker + ' explored ' + this.coord + ' first.';

	}

	hasExit( dir ) {
		return this._exits.hasOwnProperty(dir);
	}

	/**
	 * Add a new exit from this location.
	 * @param {Exit} exit 
	 */
	addExit( exit ) {
		//console.log( 'adding exit ' + exit);
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

		let r = in_prefix[this._biome] + this._biome + ' (' + this._coord.toString() + ')\n';
		r += this._desc + '\n';

		r += 'On the ground you see ' + this._inv.getList();

		r += '\nPaths:'
		for( let k in this._exits ) {
			r += '\t' + k;
		}

		
		return r;

	}

	lookItems() {

		return 'On the ground you see: ' + this._inv.getList();

	}

	/**
	 * Get item information without picking it up.
	 * @param {*} item 
	 */
	get( item ) {
		return this._inv.get(item);
	}

	/**
	 * 
	 * @param {Item} item 
	 */
	drop( item ) {
		this._inv.add( item );
	}

	/**
	 * 
	 * @param {string} what 
	 */
	take( what ) {
		return this._inv.remove( what );
	}

}

class Exit {

	static Reverse( dir ) {
		return reverses[dir];
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