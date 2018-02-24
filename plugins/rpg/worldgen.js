const Loc = require( './loc.js');

module.exports = class {

	constructor( filecache ) {

		this._fcache = filecache;

	}

	getKey( x,y ) {
		return 'rpg/locs/' + x + ',' + y;
	}

	async getLoc( x, y ) {

		let key = getKey(x,y);

		let loc = await this._fcache.get( key );
		if ( loc == null ) {
			loc = genLoc( x, y );
			this._fcache.store( key, loc );
		}
		return loc;

	}

	async fetchLoc( x, y ) {
	}

	genLoc( x, y ) {
	}

}