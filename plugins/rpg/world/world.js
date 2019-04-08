const Gen = require( './worldgen.js');
const Loc = require( './loc.js');
const Block = require( './block.js');

const Mons = require( '../monster/monster.js');

// Locations are merged into blocks of width/block_size, height/block_size.
// WARNING: Changing block size will break the fetching of existing world data.
const BLOCK_SIZE = 8;

module.exports = class World {

	/**
	 * Note that the World is using the Context cache, not a special rpg cache.
	 * @param {} fcache 
	 */
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
		if ( attach ) loc.attach = attach.url;

		let owner = loc.owner;
		if ( owner && owner !== char.name ) return 'You do not control this location.';

		if ( desc ) loc.desc = desc;

		await this.quickSave( loc );

	}

	async getNpc( char, who ) {
		let loc = await this.getOrGen(char.loc, char);
		return loc.getNpc(who);
	}

	async removeNpc( char, who ) {
		let loc = await this.getOrGen(char.loc, char);
		return loc.removeNpc(who);

	}

	/**
	 * Attempt to use a feature at the location.
	 * @param {Char} char 
	 * @param {*} wot 
	 */
	async useLoc( char, wot ) {

		let loc = await this.getOrGen( char.loc, char );

		let f = loc.getFeature( wot );
		if ( !f ) return 'You do not see any such thing here.';

		let res = f.use(char);

		if ( !res ) return 'Nothing seems to happen.';
		return res;

	}

	/**
	 * Attempt to take an item from cur location.
	 * @param {Char} char 
	 * @param {string|number|Item} first 
	 */
	async take( char, first, end ) {

		let loc = await this.getOrGen( char.loc, char );
		let it = loc.take( first, end );
		if ( !it ) return 'Item not found.';

		let ind = char.addItem( it );

		await this.quickSave( loc );

		return end ? `${char.name} took ${it.length} items.` :
			`${char.name} took ${it.name}. (${ind})`;
	}

	async hike( char, dir ) {

		let coord = char.loc;
		if ( !coord ) coord = new Loc.Coord(0,0);
		let loc;

		switch ( dir ) {
			case 'n':
			case 'north':
			loc = await this.getOrGen( new Loc.Coord( coord.x, coord.y+1), char );
			break;
			case 's':
			case 'south':
			loc = await this.getOrGen( new Loc.Coord(  coord.x, coord.y-1), char );
			break;
			case 'e':
			case 'east':
			loc = await this.getOrGen(  new Loc.Coord( coord.x+1, coord.y), char );
			break;
			case 'w':
			case 'west':
			loc = await this.getOrGen(  new Loc.Coord( coord.x-1, coord.y), char );
			break;
			default:
			return;
			break;
		}

		char.loc = loc.coord;
		return loc;

	}

	async move( char, dir ) {

		if ( !dir ) return 'Must specify movement direction.';

		let loc = char.loc;
		if ( !loc ) {
			console.error('Char loc is null');
			loc = new Loc.Coord(0,0);
		}

		loc = await this.tryMove( loc, dir, char );
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
		if ( loc.maker ) return loc.explored();

		loc.setMaker( char.name );
		return 'You are the first to explore ' + loc.coord;	

	}

	async view( char, what ) {

		let loc = await this.getOrGen( char.loc );
		if ( what ) {

			let it = loc.get( what );
			if ( !it) return 'Item not found.';
			return it.getView();

		}
		if ( loc.attach ) return [ char.name + ' is' + loc.look(), loc.attach ];
		else return char.name + ' is ' + loc.look();

	}

		/**
	 * 
	 * @param {Char} char 
	 * @param {string|number|Monster} what 
	 */
	async examine( char, what ) {

		let loc = await this.getOrGen( char.loc );

		if ( !what ) return 'Examine what?';
		
		let it = loc.getNpc( what );
		if ( !it ) return 'Creature not found.';
		return it.getDetails();
		
	}

	/**
	 * 
	 * @param {Char} char 
	 * @param {string|Number|Item} what 
	 */
	async look( char, what ) {

		let loc = await this.getOrGen( char.loc );

		if ( what ) {

			let it = loc.get( what );
			if ( !it ) return 'Item not found.';
			return it.getDetails();

		} else return char.name + ' is' + loc.look();

	}

	/**
	 * 
	 * @param {*} char 
	 * @param {Item} what 
	 */
	async put( char, what ) {
	
		let loc = await this.getOrGen( char.loc, char );
		let ind = loc.drop( what );
		await this.quickSave( loc );

		return `${char.name} dropped ${what.name}. (${ind})`;

	}

	/**
	 * Attempt to drop an item at cur location.
	 * @param {Char} char 
	 * @param {string|Item|number} what 
	 */
	async drop( char, what, end ) {

		let it = end ? char.takeRange( what, end ) : char.takeItem( what );
		if ( !it ) return 'Invalid item.';

		let loc = await this.getOrGen( char.loc, char );
		let ind = loc.drop( it );
		await this.quickSave( loc );

		if ( it instanceof Array ) return it.length + ' items dropped.';
		return `${char.name} dropped ${it.name}. (${ind})`;

	}

	/**
	 * 
	 * @param {Char} char 
	 */
	setHome( char ) {

		if ( char.home ){
			char.home.setTo( char.loc );
		} else  char.home = new Loc.Coord( char.loc.x, char.loc.y );

		return `${char.name} Home set.`;

	}

	/**
	 * 
	 * @param {Char} char 
	 */
	goHome( char ) {

		let coord = char.home;
		if ( !coord ) coord = new Loc.Coord(0,0);

		Object.assign( char.loc, coord );
		return char.name + ' has travelled home.';

	}

	/**
	 * Return the new location after moving from the given coordinate.
	 * @param {Loc.Coord} coord - current coordinate.
	 * @param {string} dir - move direction.
	 * @returns {Loc|string} - new Loc or error string.
	 */
	async tryMove( coord, dir, char ) {

		let from = await this.getLoc( coord.x, coord.y );
		if ( !from ){
			console.warn( 'error: starting loc null.');
			return 'Error: Not in a starting location.'
		} 

		dir = dir.toLowerCase();
		let exit = from.getExit( dir );

		if ( !exit ) return 'You cannot move in that direction.';

		let destCoord = exit.coord;
		let x = destCoord.x;
		let y = destCoord.y;

		let dest = await this.getLoc( x, y );

		if ( dest === null ) {

			let exits = await this.getRandExits(x,y);
			// must use NEW coord so avoid references.
			dest = Gen.genLoc( new Loc.Coord(x,y), from, exits );
			dest.setMaker( char.name );

			char.addHistory( 'explored' );
			char.addExp( 2 );

			this.quickSave( dest );

		}

		this.trySpawn( dest );

		return dest;

	}

	/**
	 * Attempt to spawn a monster at the given location.
	 * @param {Loc} loc
	 */
	trySpawn( loc ) {

		if ( Math.random() > 0.5 || loc.npcs.length>4 ) return;

		console.log('attempting spawn.');
	
		let lvl = Math.floor( loc.norm / 20 );
		let dev = Math.random() - 0.5;

		if ( Math.abs(dev) >= 0.2 ) lvl += Math.floor(10*dev)
		if ( lvl < 0) lvl = 0;

		let m = Mons.RandMonster( lvl, loc.biome );
		if ( !m ) return;

		console.log('adding monster: ' + m.name );
		loc.addNpc( m );

		return m;

	}

	async getOrGen( coord, char=null ) {

		let loc = await this.getLoc( coord.x, coord.y );

		if ( loc === null ) {

			console.log( coord + ' NOT FOUND. GENERATING NEW');
			loc = Gen.genNew( coord );

			if ( char ) loc.setMaker( char.name );

			await this.quickSave( loc );

		}

		return loc;

	}

	/**
	 * Retrieves the location at x,y. This is a legacy function
	 * before locations were stored in blocks.
	 */
	async legacyLoc( x,y ) {

		let key = this.legacyKey( x,y );

		let loc = await this.cache.fetch( key );
		if ( !loc ) return null;

		//console.log('REVIVING LEGACY LOC');
		if ( !(loc instanceof Loc.Loc) ) loc = Loc.Loc.FromJSON( loc );

		// save the location in the new block system.
		await this.forceSave(loc);

		// delete legacy location file.
		await this.cache.delete( key );

		return loc;

	}

	async getLoc( x,y ) {

		let bkey = this.getBKey(x,y);
		let block = await this.cache.fetch( bkey );

		if ( block ) {

			if ( !(block instanceof Block) ){
				block = new Block( block );
				this.cache.cache( bkey, block );
			}

			let loc = block.getLoc( this.locKey(x,y) );
			if ( loc ) return loc;
		}

		// no block location found. search legacy loc storage.
		return this.legacyLoc( x,y );

	}

	async getBlock( x,y, create=false ) {

		let bkey = this.getBKey(x,y);
		let block = await this.cache.fetch( bkey );

		if ( !block ) return ( create === true ) ? new Block( {key:bkey} ) : null;

		if ( !(block instanceof Block) ){
			block = new Block( block );
			this.cache.cache( bkey, block );
		}

		return block;

	}

	async quickSave( loc ) {

		let block = await this.getBlock( loc.x, loc.y, true );
		block.setLoc( this.coordKey(loc.coord), loc );

		this.cache.cache( block.key, block );
	}

	async forceSave( loc ) {

		let block = await this.getBlock( loc.x, loc.y, true );

		block.setLoc( this.coordKey(loc.coord), loc );
		return this.cache.store( block.key, block )

	}

	locKey( x,y ) {
		return x + ',' + y;
	}

	/**
	 * 
	 * @param {number} x 
	 * @param {number} y 
	 */
	coordKey( coord ) {
		return coord.x + ',' + coord.y;
	}

	/**
	 * Keys for legacy locations.
	 */
	legacyKey( x,y ) { return 'rpg/locs/' + x + ',' + y }

	/**
	 * 
	 * @param {number} x 
	 * @param {number} y 
	 */
	getBKey( x,y ) {
		return 'rpg/blocks/' + Math.floor(x/BLOCK_SIZE) + ',' + Math.floor(y/BLOCK_SIZE);
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
		else if (Math.random() < 0.25) return new Loc.Exit(fromDir, dest );	// TODO: this is generation logic.
		return null;
	}

	/**
	* All existing locations adjacent to x,y.
	* @param {number} x 
	* @param {number} y 
	*/
	async getNear( x,y ) {

		return [ await this.getLoc(x-1, y), await this.getLoc(x+1,y),
			await this.getLoc(x,y-1), await this.getLoc(x,y+1) ].filter( v => v!=null );

	}

}