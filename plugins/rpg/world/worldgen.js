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

		let loc = await this._fcache.fetch( key );
		if ( loc == null ) {
			loc = genLoc( x, y );
			this._fcache.store( key, loc );
		}
		return loc;

	}

	genLoc( x, y ) {
	}

	makeTown() {

		let loc = new Loc.Loc( coord, '');

		let descs = ['Ah! The peaceful ambiance of town life.',
					'Never a dull moment here.',
					'A lonesome town street.'];

		loc.desc = descs[ Math.floor(Math.random()*descs.length)];

		return loc;

	}

	makeHills() {
	}

	makeForest() {
	}

	makeSwamp() {
	}

	makePlains() {
	}

}