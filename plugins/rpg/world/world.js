const Gen = require( './worldgen.js');
const Loc = require( './loc.js');

module.exports = class World {

	constructor( fcache ) {

		this.cache = fcache;
		this.initWorld();

	}

	async initWorld() {

		let start = await this.getLoc( 0, 0 );
		if ( start != null ) return;

		try {
			start = Gen.genNew( new Loc.Coord(0,0));
			await this.cache.store( this.coordKey(start.coord), start );
		} catch(e) { console.log(e); }

	}

	/**
	 * Return the new location after moving from the given coordinate.
	 * @param {Loc.Coord} coord - current coordinate.
	 * @param {string} dir - move direction.
	 * @returns New Loc or error string.
	 */
	async getMoveLoc( coord, dir ) {

		let from = await this.getLoc( coord.x, coord.y );
		if ( from === null ){
			console.log( 'error: starting loc null.');
			return 'Error: Not in a starting location.'
		} 

		dir = dir.toLowerCase();
		let exit = from.getExit( dir );

		if ( exit == null ) return 'You cannot move in that direction.';

		try {

		let destCoord = exit.coord;
		let x = destCoord.x;
		let y = destCoord.y;

		let dest = await this.getLoc( x, y );

		if ( !dest ) {

			let exits = await this.getRandExits(x,y);
			dest = Gen.genLoc( destCoord, from, exits );
			this.cache.store( this.coordKey(destCoord), dest );

		}
		return dest;
	 	} catch ( e) { console.log(e);}



	}

	async getOrGen( coord ) {

		let key = this.coordKey(coord );
		let loc = await this.cache.fetch( key );

		if ( loc == null ) {

			console.log( coord + ' NOT FOUND. GENERATING NEW');
			loc = Gen.genNew( coord );
			this.cache.store( key, loc );


		} else if ( loc instanceof Loc.Loc ) return loc;
		else {

			// instantiate json object.
			loc = Loc.Loc.FromJSON( loc );
			// store instance in cache.
			this.cache.store( key, loc );

		}

		return loc;

	}

	/**
	 * Retrieves the location at x,y.
	 * @param {number} x - x-coord of location.
	 * @param {number} y - y-coord of location.
	 */
	async getLoc( x, y ) {

		let key = this.getKey(x,y);
		let loc = await this.cache.fetch( key );
		if ( loc == null ) return null;
		if ( loc instanceof Loc.Loc ) return loc;

		// instantiate json object.
		loc = Loc.Loc.FromJSON( loc );

		// store instance in cache.
		this.cache.store( key, loc );

		return loc;

	}

	coordKey( coord ) { return 'rpg/locs/' + coord.x + ',' + coord.y }

	getKey( x,y ) {
		return 'rpg/locs/' + x + ',' + y;
	}

	/**
	 * All existing locations adjacent to x,y.
	 * @param {number} x 
	 * @param {number} y 
	 */
	async getNear( x,y ) {

		return [ await this.locOrNull(x-1, y), await this.locOrNull(x+1,y),
			await this.locOrNull(x,y-1), await this.locOrNull(x,y+1) ].filter( v => v!=null );

	}

	/**
	 * 
	 * @param {*} x 
	 * @param {*} y
	 * @returns {Loc.Exit[]} - all exits allowed from this location.
	 */
	async getRandExits(x,y) {
		return [ await this.getExitTo( new Loc.Coord(x-1, y), 'west'),
				await this.getExitTo( new Loc.Coord(x+1,y), 'east'),
				await this.getExitTo( new Loc.Coord(x,y-1), 'south'),
				await this.getExitTo( new Loc.Coord(x,y+1), 'north') ].filter( v => v!=null );
	}

	/**
	 * Returns an exit to the given dest coordinate when arriving
	 * from the given direction.
	 * @param {Loc.Coord} dest - destination coordinate.
	 * @param {string} fromDir - arriving from direction.
	 * @returns {Loc.Exit|null}
	 */
	async getExitTo( dest, fromDir ) {
		let loc = await this.cache.fetch( this.coordKey(dest) );
		if ( loc ) {
			let e = loc.reverseExit( fromDir );
			if ( e ) return new Loc.Exit( fromDir, dest );
			// no exits lead from existing location in this direction.
			return null;
		}
		else if (Math.random() < 0.5) return new Loc.Exit(fromDir, dest );	// TODO: this is generation logic.
		return null;
	}

	/**
	 * Attempts to retrieve a location, but does not generate
	 * if it does not already exist.
	 * @param {number} x 
	 * @param {number} y
	 * @returns Loc found or null.
	 */
	async locOrNull(x,y) {
		return await this.cache.fetch( this.getKey(x,y) );
	}

}