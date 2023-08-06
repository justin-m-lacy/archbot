import { Coord, Loc, Exit, Biome } from './loc';
import * as ItemGen from '../items/itemgen';
import  Biomes from '../data/world/biomes.json';

type BiomeName = keyof typeof Biomes;

/**
 * Generate a new location without any starting information.
*/
export const genNew = (coord: Coord) => {

	// note that a new coord must be used to avoid references.
	const loc = makeBiomeLoc(new Coord(coord.x, coord.y), Biome.TOWN);
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

	const biomeName = from ? randBiome(from.biome as BiomeName) : Biome.TOWN;
	const loc = makeBiomeLoc(coord, biomeName as BiomeName);

	for (let i = exits.length - 1; i >= 0; i--) {
		loc.addExit(exits[i]);
	}

	while (Math.random() < 0.1) {
		loc.addFeature(ItemGen.randFeature());
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

export const makeBiomeLoc = (coord: Coord, biomeName: keyof typeof Biomes=Biome.PLAINS) => {

	const tmpl = Biomes[biomeName];
	if (tmpl == null) {
		console.warn('MISSING BIOME: ' + biomeName);
	}
	const loc = new Loc(coord, biomeName);

	const descs = tmpl.descs;
	loc.desc = descs[Math.floor(Math.random() * descs.length)];

	return loc;

}


/**
 * 
 * @param {string} prevBiome - name of previous biome.
 */
function randBiome(prevBiome: keyof typeof Biomes) {

	const biome = Biomes[prevBiome];
	if (biome == null) {
		console.warn('unknown biome: ' + prevBiome);
		return Biome.TOWN;
	}

	const trans = biome.trans;
	const w = Math.random() * getTransMax(trans);

	let tot = 0;

	let k:keyof typeof trans;
	for (k in trans) {

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