const Loc = require( './loc.js');

/**
 * Block of locations stored together.
 */
module.exports = class Block {


	get key() { return this._key; }
	set key(v) { this._key = v; }

	toJSON() {

		return {
			key:this._key,
			locs:this._locs
		};

	}

	constructor( json=null ) {

		this._locs = {};

		if ( json ) {

			this._key = json.key || 'unknown';

			let locs = json.locs;
			if ( locs ){

				for( let p in locs ) {
					this._locs[p] = Loc.Loc.FromJSON( locs[p] );
				} //for

			}

		}

	}

	setLoc( key, loc ) {
		this._locs[key] = loc;
	}

	getLoc( key ) {
		return this._locs[key];
	}

} // class