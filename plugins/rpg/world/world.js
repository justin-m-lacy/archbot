const Gen = require( './worldgen.js');

module.exports = class World {


	constructor( fcache ) {

		this.cache = fcache;

	}

	getKey( x,y ) {
		return 'rpg/locs/' + x + ',' + y;
	}

	/**
	 * Return all directions whose access should be blocked from x,y.
	 * @param {number} x 
	 * @param {number} y 
	 */
	async getBlocked(x,y) {

		let a = [ await this.getLoc(x-1, y), await this.getLoc(x+1,y),
			await this.getLoc(x,y-1), await this.getLoc(x,y+1) ];

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

		let a = [ await this.getLoc(x-1, y), await this.getLoc(x+1,y),
			await this.getLoc(x,y-1), await this.getLoc(x,y+1) ];

		let b = [];
		// remove empty.
		for( let i = a.length-1; i>=0;i-- ) {
			if ( a[i]) b.push( a[i]);
		}

		return b;

	}

	async getLoc( x, y ) {

		let key = getKey(x,y);

		let loc = await this.cache.fetch( key );
		if ( loc == null ) {
			loc = genLoc( x, y );
			this.cache.store( key, loc );
		}
		return loc;

	}

}

class Exit {

	constructor() {
	}

}