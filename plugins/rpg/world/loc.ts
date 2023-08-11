import Char from "../char/char";
import { Item } from "../items/item";
import Feature from './feature';
import Inventory from '../inventory';
import { ItemIndex } from '../inventory';
import Monster from '../monster/monster';

export type DirVal = 'n' | 's' | 'e' | 'w' | 'u' | 'd' | 'l' | 'r' | 'x' | 'enter' | 'unknown';
export type DirString = DirVal | 'north' | 'south' | 'east' | 'west' | 'exit' | 'up' | 'down' | 'left' | 'right';

export const toDirection = (s: string): DirVal => {
	return DirMap[s.toLowerCase()] ?? 'unknown';
}

export enum Biome {
	FOREST = 'forest',
	TOWN = 'town',
	SWAMP = 'swamp',
	PLAINS = 'plains',
	HILLS = 'hills',
	MOUNTAIN = 'mountains',
	UNDER = 'underground',
}

const in_prefix: { [Property in Biome]: string } = {
	[Biome.FOREST]: ' in a ',
	[Biome.TOWN]: ' in a ',
	[Biome.SWAMP]: ' in a ',
	[Biome.PLAINS]: ' on the ',
	[Biome.HILLS]: ' in the ',
	[Biome.MOUNTAIN]: ' in the ',
	[Biome.UNDER]: ' '
};

const DirMap: { [s: string]: DirVal } = {

	north: 'n',
	n: 'n',
	south: 's',
	s: 's',
	east: 'e',
	e: 'e',
	west: 'w',
	w: 'w',
	up: 'u',
	u: 'u',
	down: 'd',
	d: 'd',
	left: 'l',
	l: 'l',
	right: 'r',
	r: 'r',
	exit: 'x',
	x: 'x',
	enter: 'enter',
}


const reverses: Partial<Record<DirString, DirVal>> = {
	enter: DirMap.exit,
	north: DirMap.south,
	south: DirMap.north,
	east: DirMap.west,
	west: DirMap.east,
	left: DirMap.right,
	right: DirMap.left,
	up: DirMap.down,
	down: DirMap.up,
	exit: DirMap.enter,
};



export class Coord {

	x: number;
	y: number;

	constructor(x: number = 0, y: number = 0) {
		this.x = x;
		this.y = y;
	}

	setTo(coord: Coord) {
		this.x = coord.x;
		this.y = coord.y;
	}

	/**
	 * @returns {number} absolute distance from origin.
	 */
	abs() { return Math.abs(this.x) + Math.abs(this.y); }

	/**
	 * Get distance to another coordinate.
	 * @param {Coord} c - second coordinate
	 * @returns {number}
	 */
	dist(c: Coord) { return Math.abs(c.x - this.x) + Math.abs(c.y - this.y); }

	equals(c: Coord) {
		return c.x === this.x && c.y === this.y;
	}

	toString() {
		return this.x + ',' + this.y;
	}

}

export class Loc {

	get name() { return this._name; }
	set name(v) { this._name = v; }

	get areaName() { return this._areaName; }

	/**
	 * @property {string} - name of the biome.
	 */
	get biome() { return this._biome; }
	set biome(v) { this._biome = v; }

	get desc() { return this._desc; }
	set desc(v) { this._desc = v; }

	get npcs() { return this._npcs; }

	/**
	 * @property {Coord} coord
	*/
	get coord() { return this._coord; }
	set coord(v) {
		this._coord = v;
		this._key = v.toString();
	}

	get time() { return this._time; }
	set time(v) { this._time = v; }

	get exits() { return this._exits; }
	set exits(v) { this._exits = v; }

	get key() { return this._key; }

	get x() { return this._coord.x; }
	get y() { return this._coord.y; }

	get norm() { return Math.abs(this._coord.x) + Math.abs(this._coord.y); }

	get maker() { return this._maker; }
	set maker(v) { this._maker = v; }

	get attach() { return this._attach; }
	set attach(v) { this._attach = v; }

	get owner() { return this._owner; }
	set owner(v) { this._owner = v; }

	private _name?: string;
	private _desc?: string;

	private _biome: string;
	private _maker?: string;
	private _attach: any;
	private _owner?: string;
	private _time?: number;

	private _areaName?: string;

	private _features: Inventory;

	private _key!: string;
	private _coord: Coord;
	private _npcs: any[];
	private _exits: Partial<Record<DirVal, Exit>> = {};
	private readonly _inv: Inventory;

	constructor(coord: Coord, biome: string) {

		this._coord = coord;
		this._biome = biome;

		this._npcs = [];

		this._features = new Inventory();
		this._inv = new Inventory();

	}

	static FromJSON(json: any) {

		const loc = new Loc(new Coord(json.coord.x, json.coord.y), json.biome);

		const exits = json.exits;
		if (exits) {

			for (const k in exits) {
				const e = exits[k];
				loc.addExit(
					new Exit(e.dir, new Coord(e.to.x, e.to.y))
				);

			}

		}

		if (json.features) Inventory.FromJSON(json.features, loc._features);
		if (json.attach) loc._attach = json.attach;

		if (json.inv) {
			Inventory.FromJSON(json.inv, loc._inv);
		}

		loc.name = json.name;
		loc.desc = json.desc;
		loc._areaName = json.areaName;

		if (json.npcs) Loc.ParseNpcs(json.npcs, loc);

		if (json.owner) loc._owner = json.owner;
		if (json.maker) loc._maker = json.maker;
		if (json.time) loc._time = json.time;

		return loc;

	}

	static ParseNpcs(a: any[], loc: Loc) {

		let len = a.length;
		for (let i = 0; i < len; i++) {

			var m = Monster.FromJSON(a[i]);
			console.log('reviving npc: ' + m.name);
			if (m) loc.addNpc(m);

		} //for

	}

	toJSON() {

		return {
			coord: this._coord,
			exits: this._exits,
			inv: this._inv,
			desc: this._desc,
			areaName: this._areaName,
			name: this._name,
			biome: this._biome,
			npcs: this._npcs ?? undefined,
			features: this._features ?? undefined,
			attach: this._attach ?? undefined,
			maker: this._maker ?? undefined,
			time: this._time ?? undefined,
			owner: this._owner ?? undefined

		};

	}

	setMaker(n: string) {
		this._maker = n;
		this._time = Date.now();
	}

	explored() {

		if (!this._maker) return 'Never explored.';
		if (this._time) return `Explored by ${this._maker} at ${new Date(this._time).toLocaleDateString()}`;
		return 'First explored by ' + this._maker + '.';

	}

	hasExit(dir: DirVal) {
		return this._exits.hasOwnProperty(dir);
	}

	/**
	 * Add a new exit from this location.
	 * @param {Exit} exit
	 */
	addExit(exit: Exit) {
		//console.log( 'adding exit ' + exit);
		this._exits[exit.dir] = exit;
	}

	/**
	 *
	 * @param dir
	 */
	getExit(dir: DirVal) {
		return this._exits[dir];
	}

	/**
	 * Returns the exit that leads back from the given direction.
	 * e.g. fromDir == 'west' returns the 'east' exit, if it exists.
	 * @param {*} fromDir - direction arriving from.
	 * @returns {Exit|null}
	 */
	reverseExit(fromDir: DirVal) {
		const reverse = reverses[fromDir];
		return reverse ? this._exits[reverse] : undefined;
	}

	/**
	 * Returns exit leading to coord, or null
	 * if none exists.
	 * @param {Coord} coord
	 * @returns {Exit|null}
	 */
	getExitTo(coord: Coord) {

		let k: DirVal;
		for (k in this._exits) {
			if (this._exits[k]?.to.equals(coord)) {
				return this._exits[k];
			}
		}
		return null;

	}

	view() { return [this.look(true), this._attach]; }

	/**
	 * Returns everything seen when 'look'
	 * is used at this location.
	*/
	look(imgTag: boolean = true) {

		let r = in_prefix[this._biome as Biome] + this._biome;//+ ' (' + this._coord.toString() + ')';
		if (this._attach && imgTag) r += ' [img]';
		r += '\n' + this._desc;

		if (this._features.length > 0) r += '\nFeatures: ' + this._features.getList();
		r += '\nOn ground: ' + this._inv.getList();

		if (this._npcs.length > 0) {
			r += '\nCreatures: ';
			r += this.npcList();
		}

		r += '\nPaths:'
		for (let k in this._exits) {
			r += '\t' + k;
		}

		return r;

	}

	/**
	 *
	 * @param {Char} char
	 * @param {Feature|string|number} wot
	 */
	use(char: Char, wot: string | number | Feature) {

		let f: Feature | null;
		if (typeof wot !== 'object') {
			f = this._features.get(wot) as Feature;
			if (!f) return false;
		} else {
			f = wot;
		}

		return f.use(char);

	}

	lookFeatures() { return 'Features: ' + this._features.getList(); }

	lookItems() { return 'On ground: ' + this._inv.getList(); }

	/**
	 *
	 * @param {Feature} f
	 */
	addFeature(f: Feature | null) { if (f) this._features.add(f); }

	/**
	 *
	 * @param {string|number} wot
	 */
	getFeature(wot: string | number) { return this._features.get(wot) as Feature; }

	/**
	 * Get item data without taking it.
	 */
	get(item: ItemIndex) { return this._inv.get(item); }

	/**
	 *
	 * @param {Item|Item[]} item
	 */
	drop(item: Item | Item[]) { return this._inv.add(item); }

	takeRange(start: number, end: number) {
		return this._inv.takeRange(start, end);
	}

	/**
	 *
	 * @param {string} what
	 */
	take(what: string | number) { return this._inv.take(what); }

	getNpc(wot: string | number) {

		if (typeof wot === 'string') {
			let ind = Number.parseInt(wot);
			if (Number.isNaN(ind)) {
				return this._npcs.find((m) => m.name === wot);

			} else {
				wot = ind;
			}
		}
		return this._npcs[wot - 1];
	}

	addNpc(m: Monster) { this._npcs.push(m); }

	removeNpc(m: Monster) {

		let ind = this._npcs.indexOf(m);
		console.log('removing npc at: ' + ind);
		if (ind >= 0) return this._npcs.splice(ind, 1)[0];
		return null;

	}

	npcList() {

		let len = this._npcs.length;
		if (len === 0) return 'none';
		if (len === 1) return this._npcs[0].name;

		let s = this._npcs[0].name;
		for (let i = 1; i < len; i++) s += ', ' + this._npcs[i].name;
		return s;

	}

}

export class Exit {

	static Reverse(dir: DirVal) {
		return reverses[dir];
	}

	dir: DirVal;
	to: Coord;

	constructor(dir: DirVal, toCoord: Coord) {

		this.dir = dir;
		this.to = toCoord;

	}

	toString() {
		return 'exit ' + this.dir + ' to ' + this.to;
	}

}