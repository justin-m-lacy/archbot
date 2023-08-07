import Cache from 'archcache';
import Char from '../char/char';
import { Item } from '../items/item';
import { Coord, Loc, DirString, Exit, DirVal } from './loc';
import { ItemPicker, ItemIndex } from '../items/container';
import Monster from '../monster/monster';
import Block from './block';
import * as Gen from './worldgen';
import Feature from './feature';

// Locations are merged into blocks of width/block_size, height/block_size.
// WARNING: Changing block size will break the fetching of existing world data.
const BLOCK_SIZE = 8;

export default class World {

	readonly cache: Cache;

	/**
	 * Note that the World is using the Context cache, not a special rpg cache.
	 * Why?
	 * @param {} fcache
	 */
	constructor(fcache: Cache) {

		this.cache = fcache;
		this.initWorld();

	}

	async initWorld() {
		await this.getOrGen(new Coord(0, 0));
	}

	/**
	 * Change location description.
	 * @param {Char} char
	 * @param {string} desc
	 */
	async setDesc(char: Char, desc?: string, attach?: string) {

		const loc = await this.getOrGen(char.loc, char);
		if (attach) loc.attach = attach;

		const owner = loc.owner;
		if (owner && owner !== char.name) return 'You do not control this location.';

		if (desc) loc.desc = desc;

		await this.quickSave(loc);

	}

	/**
	 * Get an Npc at Character location.
	 * @param {Char} char
	 * @param {*} who
	 */
	async getNpc(char: Char, who: ItemIndex) {
		const loc = await this.getOrGen(char.loc, char);
		return loc.getNpc(who);
	}

	/**
	 * Remove Npc at Character location.
	 * @param {Char} char
	 * @param {*} who
	 */
	async removeNpc(char: Char, who: Monster) {
		const loc = await this.getOrGen(char.loc, char);
		return loc.removeNpc(who);

	}

	/**
	 * Attempt to use a feature at the location.
	 * @param {Char} char
	 * @param {*} wot
	 */
	async useLoc(char: Char, wot: string | number | Feature) {

		const loc = await this.getOrGen(char.loc, char);

		const f = typeof wot !== 'object' ? loc.getFeature(wot) : wot;
		if (!f) return 'You do not see any such thing here.';

		const res = f.use(char);

		if (!res) return 'Nothing seems to happen.';
		return res;

	}

	/**
	 * Attempt to take an item from cur location.
	 * @param {Char} char
	 * @param {string|number|Item} first
	 */
	async take(char: Char, first: string | number, end?: string | number) {

		const loc = await this.getOrGen(char.loc, char);

		const it = (end != null) ? loc.takeRange(first as number, end as number) : loc.take(first);
		if (!it) return 'Item not found.';

		const ind = char.addItem(it);
		await this.quickSave(loc);

		return Array.isArray(it) ? `${char.name} took ${it.length} items.` :
			`${char.name} took ${it.name}. (${ind})`;
	}

	async hike(char: Char, dir: DirString) {

		const coord = char.loc || new Coord(0, 0);
		let loc;

		switch (dir) {
			case 'n':
			case 'north':
				loc = await this.getOrGen(new Coord(coord.x, coord.y + 1), char);
				break;
			case 's':
			case 'south':
				loc = await this.getOrGen(new Coord(coord.x, coord.y - 1), char);
				break;
			case 'e':
			case 'east':
				loc = await this.getOrGen(new Coord(coord.x + 1, coord.y), char);
				break;
			case 'w':
			case 'west':
				loc = await this.getOrGen(new Coord(coord.x - 1, coord.y), char);
				break;
			default:
				return;
		}

		char.loc = loc.coord;
		return loc;

	}

	async move(char: Char, dir: DirVal) {

		if (!dir) return 'Must specify movement direction.';

		const loc = await this.tryMove(char.loc ?? new Coord(0, 0), dir, char);
		if (typeof loc === 'string') {
			return loc;
		} else {

			char.loc = loc.coord;
			return char.name + ' is' + loc.look()
		}

	}

	/**
	 *
	 * @param {Char} char
	 * @returns {string} description of loc maker and time, or error message.
	 */
	async explored(char: Char) {

		const loc = await this.getOrGen(char.loc);
		if (loc.maker) return loc.explored();

		loc.setMaker(char.name);
		return 'You are the first to explore ' + loc.coord;

	}

	async view(char: Char, what?: string | number) {

		const loc = await this.getOrGen(char.loc);
		if (what) {

			const it = loc.get(what);
			if (!it) return 'Item not found.';
			return it.getView();

		}
		if (loc.attach) return [char.name + ' is' + loc.look(), loc.attach];
		else return char.name + ' is ' + loc.look();

	}

	/**
	 * Examine world at character location.
	 * @param {Char} char
	 * @param {string|number} what
	 */
	async examine(char: Char, what: string | number) {

		const loc = await this.getOrGen(char.loc);

		if (!what) return 'Examine what?';

		const it = loc.getNpc(what);
		if (!it) return 'Creature not found.';
		return it.getDetails();

	}

	async look(char: Char, what: string | number) {

		const loc = await this.getOrGen(char.loc);

		if (what) {

			const it = loc.get(what);
			if (!it) return 'Item not found.';
			return it.getDetails();

		} else return char.name + ' is' + loc.look();

	}

	/**
	 *
	 * @param {*} char
	 * @param {Item} what
	 */
	async put(char: Char, what: Item) {

		const loc = await this.getOrGen(char.loc, char);
		const ind = loc.drop(what);
		await this.quickSave(loc);

		return `${char.name} dropped ${what.name}. (${ind})`;

	}

	/**
	 * Attempt to drop an item at cur location.
	 * @param {Char} char
	 * @param  what
	 */
	async drop(char: Char, what: ItemPicker, end?: string | number) {

		const it = end ? char.takeRange(what as ItemIndex, end) : char.takeItem(what);
		if (!it) return 'Invalid item.';

		const loc = await this.getOrGen(char.loc, char);
		const ind = loc.drop(it);
		await this.quickSave(loc);

		if (Array.isArray(it)) return it.length + ' items dropped.';
		return `${char.name} dropped ${it.name}. (${ind})`;

	}

	/**
	 *
	 * @param {Char} char
	 */
	setHome(char: Char) {

		if (char.home) {
			char.home.setTo(char.loc);
		} else char.home = new Coord(char.loc.x, char.loc.y);

		return `${char.name} Home set.`;

	}

	/**
	 *
	 * @param {Char} char
	 */
	goHome(char: Char) {

		const coord = char.home ?? new Coord(0, 0);

		Object.assign(char.loc, coord);
		return char.name + ' has travelled home.';

	}

	/**
	 * Return the new location after moving from the given coordinate.
	 * @param {Coord} coord - current coordinate.
	 * @param {string} dir - move direction.
	 * @returns new Loc or error string.
	 */
	async tryMove(coord: Coord, dir: DirVal, char: Char): Promise<Loc | string> {

		const from = await this.getLoc(coord.x, coord.y);
		if (!from) {
			console.warn('error: starting loc null.');
			return 'Error: Not in a starting location.'
		}

		const exit = from.getExit(dir);

		if (!exit) return 'You cannot move in that direction.';

		const destX = exit.to.x;
		const destY = exit.to.y;

		let dest = await this.getLoc(destX, destY);

		if (dest == null) {

			const exits = await this.getRandExits(destX, destY);
			// must use NEW coord so avoid references.
			dest = Gen.genLoc(new Coord(destX, destY), from, exits);
			dest.setMaker(char.name);

			char.addHistory('explored');
			char.addExp(2);

			this.quickSave(dest);

		}

		this.trySpawn(dest);

		return dest;

	}

	/**
	 * Attempt to spawn a monster at the given location.
	 * @param {Loc} loc
	 */
	trySpawn(loc: Loc) {

		if (Math.random() > 0.5 || loc.npcs.length > 4) return;

		const dev = Math.random() - 0.5;
		const lvl = Math.max( Math.floor(loc.norm / 20 + 10*dev), 0 );

		const m = Monster.RandMonster(lvl, loc.biome);
		if (!m) return;

		loc.addNpc(m);

		return m;

	}

	async getOrGen(coord: Coord, char?: Char) {

		let loc = await this.getLoc(coord.x, coord.y);

		if (loc == null) {

			console.log(coord + ' NOT FOUND. GENERATING NEW');
			loc = Gen.genNew(coord);

			if (char) loc.setMaker(char.name);

			await this.quickSave(loc);

		}

		return loc;

	}

	async getLoc(x: number, y: number) {

		const bkey = this.getBKey(x, y);
		let block = await this.cache.fetch(bkey) as Block;

		if (block) {

			if (!(block instanceof Block)) {
				block = new Block(block);
				this.cache.cache(bkey, block);
			}

			return block.getLoc(this.locKey(x, y));
		}

	}

	async getBlock(x: number, y: number, create: boolean = false) {

		const bkey = this.getBKey(x, y);
		let block = await this.cache.fetch(bkey);

		if (!block) return (create === true) ? new Block({ key: bkey }) : null;

		if (!(block instanceof Block)) {
			block = new Block(block);
			this.cache.cache(bkey, block);
		}

		return block;

	}

	async quickSave(loc: Loc) {

		const block = await this.getBlock(loc.x, loc.y, true);
		block.setLoc(this.coordKey(loc.coord), loc);

		this.cache.cache(block.key, block);
	}

	async forceSave(loc: Loc) {

		const block = await this.getBlock(loc.x, loc.y, true);

		block.setLoc(this.coordKey(loc.coord), loc);
		return this.cache.store(block.key, block)

	}

	locKey(x: number, y: number) {
		return x + ',' + y;
	}

	/**
	 *
	 * @param {number} x
	 * @param {number} y
	 */
	coordKey(coord: Coord) {
		return coord.x + ',' + coord.y;
	}
	/**
	 *
	 * @param {number} x
	 * @param {number} y
	 */
	getBKey(x: number, y: number) {
		return 'rpg/blocks/' + Math.floor(x / BLOCK_SIZE) + ',' + Math.floor(y / BLOCK_SIZE);
	}


	/**
	 *
	 * @param {number} x
	 * @param {number} y
	 * @returns {Loc.Exit[]} - all exits allowed from this location.
	 */
	async getRandExits(x: number, y: number) {
		return Promise.all([this.getExitTo(new Coord(x - 1, y), 'w'),
		this.getExitTo(new Coord(x + 1, y), 'e'),
		this.getExitTo(new Coord(x, y - 1), 's'),
		this.getExitTo(new Coord(x, y + 1), 'n')]).then(v => v.filter(e => e != null) as Exit[]);


	}

	/**
	 * Returns an exit to the given dest coordinate when arriving
	 * from the given direction.
	 * @param {Loc.Coord} dest - destination coordinate.
	 * @param {string} fromDir - arriving from direction.
	 * @returns {Loc.Exit|null}
	 */
	async getExitTo(dest: Coord, fromDir: DirVal) {
		const loc = await this.getLoc(dest.x, dest.y);
		if (loc) {
			const e = loc.reverseExit(fromDir);
			if (e) return new Exit(fromDir, dest);
			// no exits lead from existing location in this direction.
			return null;
		}
		else if (Math.random() < 0.4) return new Exit(fromDir, dest);	// TODO: this is generation logic.
		return null;
	}

	/**
	* All existing locations adjacent to x,y.
	* @param {number} x
	* @param {number} y
	*/
	async getNear(x: number, y: number) {

		return [await this.getLoc(x - 1, y), await this.getLoc(x + 1, y),
		await this.getLoc(x, y - 1), await this.getLoc(x, y + 1)].filter(v => v != null);

	}

}