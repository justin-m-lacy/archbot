const Gen = require( './worldgen.js');
const Loc = require( './loc.js');
//const game = require( '../game.js');

module.exports = class World {

	constructor( fcache ) {

		this.cache = fcache;
		this.initWorld();

	}

	async initWorld() {
		await this.getOrGen( new Loc.Coord(0,0));
	}

	/**
	 * Change location description.
	 * @param {Char} char 
	 * @param {string} desc 
	 */
	async setDesc( char, desc, attach ) {

		let loc = await this.getOrGen( char.loc, char );
		if ( attach ) loc.attach = attach.proxyURL;

		let owner = loc.owner;
		if ( owner && owner !== char.name ) return 'You do not control this location.';

		if ( desc ) loc.desc = desc;

		this.quickSave( loc );

	}

	/**
	 * Attempt to take an item from cur location.
	 * @param {Char} char 
	 * @param {string|number|Item} what 
	 */
	async take( char, what ) {

		let loc = await this.getOrGen( char.loc, char );
		let it = loc.take( what );
		if ( !it ) return 'You do not see any ' + what + ' here.';

		char.addItem( it );

		this.quickSave( loc );

		return char.name + ' took ' + it.name;
	}

	async move( char, dir ) {

		if ( !dir ) return 'Must specify movement direction.';

		let loc = char.loc;
		if ( !loc ) {
			console.log('error: char loc is null');
			loc = new Loc.Coord(0,0);
		}

		loc = await this.getMoveLoc( loc, dir, char );
		if ( typeof(loc) === 'string') return loc;

		char.loc = loc.coord;
		return char.name + ' is' + loc.look()

	}

	/**
	 * 
	 * @param {Char} char
	 * @returns {string} description of loc maker and time, or error message. 
	 */
	async explored( char ) {

		let loc = await this.getOrGen( char.loc );

		if ( !loc.maker ) {
			loc.setMaker( char.name );
			return 'You are the first to explore ' + loc.coord;
		}
		return loc.explored();

	}

	async view( char, what ) {

		let loc = await this.getOrGen( char.loc );
		if ( what ) {

			let it = loc.get( what );
			if ( !it) return 'Item not found.';
			return it.getView();

		}
		return [ char.name + ' is' + loc.look(), loc.attach ];

	}

	/**
	 * 
	 * @param {Char} char 
	 * @param {string|number|Item} what 
	 */
	async look( char, what ) {

		let loc = await this.getOrGen( char.loc );
		//console.log('looking at: ' + char.loc );
		if ( what ) {

			let it = loc.get( what );
			if ( !it ) return 'Item not found.';
			return it.getDetails();

		} else return char.name + ' is' + loc.look();

	}

	/**
	 * Attempt to drop an item at cur location.
	 * @param {Char} char 
	 * @param {string|Item|number} what 
	 */
	async drop( char, what) {

		let it = char.takeItem( what );
		if ( !it ) return 'No such item.';

		let loc = await this.getOrGen( char.loc, char );
		loc.drop( it );
		this.quickSave( loc );

		return char.name + ' dropped ' + it.name;

	}

	/**
	 * 
	 * @param {Char} char 
	 */
	setHome( char ) {

		char.home = char.loc;
		return 'Home set.';

	}

	/**
	 * 
	 * @param {Char} char 
	 */
	goHome( char ) {

		let coord = char.home;
		if ( !coord ) return 'No home set.';

		Object.assign( char.loc, coord );
		return char.name + ' has travelled home.';

	}

	quickSave( loc ) {
		this.cache.cache( this.coordKey(loc.coord), loc );
	}

	async forceSave( loc ) {
		await this.cache.store( this.coordKey(loc.coord), loc )
	}

	/**
	 * Return the new location after moving from the given coordinate.
	 * @param {Loc.Coord} coord - current coordinate.
	 * @param {string} dir - move direction.
	 * @returns New Loc or error string.
	 */
	async getMoveLoc( coord, dir, char ) {

		let from = await this.getLoc( coord.x, coord.y );
		if ( !from ){
			console.log( 'error: starting loc null.');
			return 'Error: Not in a starting location.'
		} 

		dir = dir.toLowerCase();
		let exit = from.getExit( dir );

		if ( !exit ) return 'You cannot move in that direction.';

		let destCoord = exit.coord;
		let x = destCoord.x;
		let y = destCoord.y;

		let dest = await this.getLoc( x, y );

		if ( !dest ) {

			let exits = await this.getRandExits(x,y);
			dest = Gen.genLoc( destCoord, from, exits );
			dest.setMaker( char.name );

			char.addExplored();
			char.addExp( 1 );

			this.cache.cache( this.coordKey(destCoord), dest );

		}
		return dest;

	}

	async getOrGen( coord, char=null ) {

		let key = this.coordKey(coord );
		let loc = await this.cache.fetch( key );

		if ( !loc ) {

			console.log( coord + ' NOT FOUND. GENERATING NEW');
			loc = Gen.genNew( coord );

			if ( char ) loc.setMaker( char.name );

			this.cache.cache( key, loc );


		} else if ( loc instanceof Loc.Loc ) return loc;
		else {

			// instantiate json object.
			loc = Loc.Loc.FromJSON( loc );
			// store instance in cache.
			this.cache.cache( key, loc );

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
		if ( !loc ) return null;
		if ( loc instanceof Loc.Loc ) return loc;

		// instantiate json object.
		loc = Loc.Loc.FromJSON( loc );

		// store instance in cache.
		await this.cache.store( key, loc );

		return loc;

	}

	/**
	 * 
	 * @param {Loc.Coord} coord 
	 */
	coordKey( coord ) { return 'rpg/locs/' + coord.x + ',' + coord.y }

	/**
	 * 
	 * @param {number} x 
	 * @param {number} y 
	 */
	getKey( x,y ) {
		return 'rpg/locs/' + x + ',' + y;
	}

	/**
	 * 
	 * @param {number} x 
	 * @param {number} y
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
		let loc = await this.getLoc( dest.x, dest.y);
		if ( loc ) {
			let e = loc.reverseExit( fromDir );
			if ( e ) return new Loc.Exit( fromDir, dest );
			// no exits lead from existing location in this direction.
			return null;
		}
		else if (Math.random() < 0.8) return new Loc.Exit(fromDir, dest );	// TODO: this is generation logic.
		return null;
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