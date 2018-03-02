const Gen = require( './worldgen.js');
const Loc = require( './loc.js');

module.exports = class World {

	constructor( fcache ) {

		this.cache = fcache;

	}

	/**
	 * Return the new location after moving from the given coordinate.
	 * @param {Loc.Coord} coord 
	 * @param {string} dir
	 * @returns New Loc or error string.
	 */
	async getMoveLoc( coord, dir ) {

		let loc = await this.getLoc( coord.x, coord.y );
		let exit = loc.getExit( dir );

		if ( exit == null ) return 'You cannot move in that direction.';

		let x,y;

		switch ( dir ) {

			case 'north':
				x = coord.x;
				y = coord.y +1;
				break;
			case 'south':
				x = coord.x;
				y = coord.y-1;
				break;
			case 'east':
				x = coord.x+1;
				y = coord.y;
				break;
			case 'west':
				x = coord.x -1;
				y = coord.y;
				break;
			default:
				return 'Invalid direction.';
		}



	}

	/**
	 * Retrieves the location at x,y and generates
	 * one if it does not already exist.
	 * @param {*} x 
	 * @param {*} y 
	 */
	async getLoc( x, y ) {

		let key = getKey(x,y);

		let loc = await this.cache.fetch( key );
		if ( loc == null ) {

			let adj = await this.getNear(x,y);

			loc = genLoc( x, y, null, adj );

			this.cache.store( key, loc );

		}
		return loc;

	}

	coordKey( coord ) { return 'rpg/locs/' + coord.x + ',' + coord.y }

	getKey( x,y ) {
		return 'rpg/locs/' + x + ',' + y;
	}

	/**
	 * Return all directions whose access should be blocked from x,y.
	 * @param {number} x 
	 * @param {number} y 
	 */
	async getBlocked(x,y) {

		let a = [ await this.locOrNull(x-1, y), await this.locOrNull(x+1,y),
			await this.locOrNull(x,y-1), await this.locOrNull(x,y+1) ];

		let exit, blocked = {};

		exit = a[0] != null ? a[0].east : null;
		if ( !exit || exit.locked ) blocked.west = true;

		exit = a[1] != null ? a[1].west : null;
		if ( !exit || exit.locked ) blocked.east = true;

		exit = a[2] != null ? a[2].north : null;
		if ( !exit || exit.locked ) blocked.south = true;

		exit = a[3] != null ? a[3].south : null;
		if ( !exit || exit.locked ) blocked.north = true;

		return blocked;

	}

	/**
	 * All existing locations adjacent to x,y.
	 * @param {number} x 
	 * @param {number} y 
	 */
	async getNear( x,y ) {

		let a = [ await this.locOrNull(x-1, y), await this.locOrNull(x+1,y),
			await this.locOrNull(x,y-1), await this.locOrNull(x,y+1) ];

		let b = [];
		// remove empty.
		for( let i = a.length-1; i>=0;i-- ) {
			if ( a[i]) b.push( a[i]);
		}

		return b;

	}

		/**
	 * Attempt to retrieve a location, but do not generate
	 * if it does not already exist.
	 * @param {number} x 
	 * @param {number} y
	 * @returns Loc found or null.
	 */
	async locOrNull(x,y) {
		return await this.cache.fetch( this.getKey(x,y) );
	}

}