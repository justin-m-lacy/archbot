import { Coord, Loc, Exit, DirVal, Biome } from './loc';
const itemgen = require('../items/itemgen');
const biomes = require('../data/world/biomes.json');




/**
 * Generate a new location without any starting information.
*/
export const genNew = (coord: Coord) => {

	// note that a new coord must be used to avoid references.
	let loc = makeBiomeLoc(new Coord(coord.x, coord.y), Biome.TOWN);
	loc.exits = genExits(coord.x, coord.y);

	return loc;

}

/**
 * 
 * @param {Loc.Coord} coord 
 * @param {Loc.Loc} from - location arriving from.
 * @param {Loc.Exit[]} adj - all allowed exits.
 */
export const genLoc = (coord: Coord, from: Loc, exits: Exit[]) => {

	let biomeName = from ? randBiome(from.biome) : Biome.TOWN;
	let loc = makeBiomeLoc(coord, biomeName);

	for (let i = exits.length - 1; i >= 0; i--) {
		loc.addExit(exits[i]);
	}

	while (Math.random() < 0.1) {
		loc.addFeature(itemgen.genFeature());
	}

	return loc;

}


/**
 * Generate starting exits.
 */
export const genExits = (x: number, y: number) => {

	return {
		w: new Exit('w', new Coord(x - 1, y)),
		e: new Exit('e', new Coord(x + 1, y)),
		n: new Exit('n', new Coord(x, y + 1)),
		s: new Exit('s', new Coord(x, y - 1))
	};

}

export const makeBiomeLoc = (coord: Coord, biomeName?: string) => {

	if (biomeName == null) {
		biomeName = Biome.PLAINS;
		console.warn(biomeName + ' is not a valid biome.');
	}
	let tmpl = biomes[biomeName];
	if (tmpl == null) {
		console.warn('NO BIOME: ' + biomeName);
	}
	let loc = new Loc(coord, biomeName);

	let descs = tmpl.descs;
	loc.desc = descs[Math.floor(Math.random() * descs.length)];

	return loc;

}


/**
 * 
 * @param {string} prevBiome - name of previous biome.
 */
function randBiome(prevBiome: string) {

	let biome = biomes[prevBiome];
	if (biome == null) {
		console.warn('unknown biome: ' + prevBiome);
		return Biome.TOWN;
	}

	let trans = biome.trans;
	let w = Math.random() * getTransMax(trans);

	let tot = 0;
	for (let k in trans) {

		tot += trans[k];
		if (w <= tot) {
			return k;
		}
	}

}

/**
* Returns and caches total weights in biome-transitions object.
* @param {*} trans 
*/
function getTransMax(trans: any) {

	if (trans.max) return trans.max;
	let max = 0;
	for (let k in trans) {
		max += trans[k];
	}
	trans.max = max;
	return max;

}