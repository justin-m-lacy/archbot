const Loc = require( './loc.js');

const biomes = require( '../data/world/biomes.json');


module.exports = class {

	constructor() {
	}

	genLoc( x, y, from ) {

		let biomeName = randBiome( from.biome || Loc.PLAINS );

		let tmpl = biomes[biomeName];

		let loc = new Loc.Loc( new Loc.Coord(x,y), biomeName );

		let descs = tmpl.descs;
		loc.desc = descs[ Math.floor(Math.random()*descs.length)];

		return loc;

	}

	genExits( blocked ) {

		let exits = [];
		if ( !blocked.west && Math.random() < 0.5 ) {
			exits.push( new Loc.Exit('west') );
		}
		if ( !blocked.east && Math.random() < 0.5 ) {
			exits.push( new Loc.Exit('east') );
		}
		if ( !blocked.north && Math.random() < 0.5 ) {
			exits.push( new Loc.Exit('north') );
		}
		if ( !blocked.south && Math.random() < 0.5 ) {
			exits.push( new Loc.Exit('south') );
		}

	}

}

function randBiome( srcBiome ) {
	
	let biome = biomes[ from.biome ];
	if ( biome == null ) {
		console.log( 'error: unknown biome: ' + srcBiome );
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