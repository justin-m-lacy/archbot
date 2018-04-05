const Loc = require( './loc.js');
const itemgen = require( '../items/itemgen.js');
const biomes = require( '../data/world/biomes.json');


module.exports = class {

	constructor() {
	}

	/**
	 * Generate a new location without any starting information.
	*/
	static genNew( coord ){

		// note that a new coord must be used to avoid references.
		let loc = this.makeBiomeLoc( new Loc.Coord(coord.x, coord.y), Loc.TOWN );
		loc.exits = this.genExits( coord.x, coord.y );

		return loc;

	}

	/**
	 * 
	 * @param {Loc.Coord} coord 
	 * @param {Loc.Loc} from - location arriving from.
	 * @param {Loc.Exit[]} adj - all allowed exits.
	 */
	static genLoc( coord, from, exits ) {

		let biomeName = from ? randBiome( from.biome ) : Loc.TOWN;
		let loc = this.makeBiomeLoc( coord, biomeName );

		for( let i = exits.length-1; i>= 0; i-- ) {
			loc.addExit( exits[i]);
		}

		while( Math.random() < 0.1 ) {
			loc.addFeature( itemgen.genFeature() );
		}

		return loc;

	}


	/**
	 * Generate starting exits.
	 */
	static genExits( x,y ) {

		return { west:new Loc.Exit('west', new Loc.Coord(x-1,y) ),
		east:new Loc.Exit('east', new Loc.Coord(x+1,y) ),
		north:new Loc.Exit('north', new Loc.Coord(x,y+1) ),
		south:new Loc.Exit('south', new Loc.Coord(x,y-1) ) };

	}

	static makeBiomeLoc( coord, biomeName ) {

		if ( biomeName == null) {
			 biomeName = Loc.PLAINS;
			 console.log('ERR: ' + biomeName + ' is not a valid biome.');
		}
		let tmpl = biomes[biomeName];
		if ( tmpl == null ) {
			console.log( 'err: NO BIOME: ' + biomeName );
		}
		let loc = new Loc.Loc( coord, biomeName );

		let descs = tmpl.descs;
		loc.desc = descs[ Math.floor(Math.random()*descs.length)];

		return loc;

	}

}

/**
 * 
 * @param {string} prevBiome - name of previous biome.
 */
function randBiome( prevBiome ) {
	
	let biome = biomes[ prevBiome ];
	if ( biome == null ) {
		console.log( 'error: unknown biome: ' + prevBiome );
		return Loc.TOWN;
	}

	let trans = biome.trans;
	let w = Math.random()*getTransMax( trans );

	let tot = 0;
	for( k in trans ) {

		tot += trans[k];
		if ( w <= tot ) {
			return k;
		}
	}

}

/**
* Returns and caches total weights in transitions object.
* @param {*} trans 
*/
function getTransMax( trans ) {

	if ( trans.max ) return trans.max;
	let max = 0;
	for( k in trans ) {
		max += trans[k];
	}
	trans.max = max;
	return max;

}