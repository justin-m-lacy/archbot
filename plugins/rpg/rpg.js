var initialized = false;

// includes after init.
var util, Char, Race, CharClass, CharGen, item, Trade, World, Loc;

const display = require( './display');
const RPG_DIR = 'rpg';
const LAST_CHARS = RPG_DIR + '/`lastchars`';

var races, raceByName;
var classes, classByName;

function initData() {

	initialized = true;

	util = require('../../jsutils.js');
	Char = exports.Char = require( './char/char.js');
	Race = exports.Race = require( './race.js');
	CharClass = exports.CharClass = require( './charclass.js' );	
	CharGen = require( './chargen.js' );
	item = require( './items/item.js' );
	Trade = require ( './trade.js' );
	World = require( './world/world.js');
	Loc = require( './world/loc.js');

	initRaces();
	initClasses();

}

// created for each discord context.
class RPG {

	/**
	 * 
	 * @param {botcontext.Context} context 
	 */
	constructor( context ) {

		try {

			this._context = context;
			console.log( "Creating RPG instance.");

			if ( !initialized) initData();

			// active chars by user id.
			this.activeChars = {};

			this.world = new World( this._context.cache );

		} catch ( e ) { console.log(e); }

	}

	async cmdAllChars( msg, uname=null ) {

		try {
			let list = await this._context.getDataList(RPG_DIR );
			if ( list == null ) msg.reply( 'An unknown error has occurred. Oopsie.');
			else {
				msg.reply( list.join(', ') );
			}
		} catch(e) { console.log(e);}

	}

	async cmdSetHome( m ) {

		let char = await this.activeCharOrErr( m, m.author );
		if ( char == null ) return;

		m.reply( this.world.setHome( char ) );
		this.cacheChar( char );

	}

	async cmdGoHome( m ) {

		let char = await this.activeCharOrErr( m, m.author );
		if ( char == null ) return;

		m.reply( this.world.goHome( char ) );
		this.cacheChar( char );

	}

	async cmdLocDesc( m, desc ) {

		let char = await this.activeCharOrErr( m, m.author );
		if ( char == null ) return;

		let resp = await this.world.setDesc( char, desc );
		if ( resp ) m.reply( resp );

	}

	async cmdTake( msg, what ){

		try {

			let char = await this.activeCharOrErr( msg, msg.author )
			if ( char == null ) return;

			let resp = await this.world.take( char, what );
			msg.channel.send( resp);

		} catch ( e) { console.log(e); }
	}

	async cmdDrop( msg, what ) {

		try {
			let char = await this.activeCharOrErr( msg, msg.author )
			if ( char == null ) return;

			let resp = await this.world.drop( char, what );
			msg.channel.send( resp);

		} catch ( e) { console.log(e); }

	}

	async cmdExplored( m ) {
		
		let char = await this.activeCharOrErr( m, m.author );
		if ( char == null ) return;

		let res = await this.world.explored(char);
		display.sendBlock( m, res );

	}

	async cmdLook( msg, what ) {

		let char = await this.activeCharOrErr( msg, msg.author )
		if ( char == null ) return;

		display.sendBlock( msg, await this.world.look( char, what ) );

	}

	async cmdMove( msg, dir ) {

		try {

			let char = await this.activeCharOrErr( msg, msg.author )
			if ( char == null ) return;

			display.sendBlock( msg, await this.world.move(char,dir) );

		} catch ( e) { console.log(e);}

	}

	/**
	 * Roll damage test with current weapon.
	 * @param {*} msg 
	 */
	async cmdRollDmg( msg ) {

		let char = await this.activeCharOrErr( msg, msg.author )
		if ( char == null ) return;

		msg.reply( 'Weapon roll for ' + char.name + ': ' + char.testDmg() );

	}

		/**
	 * Roll a new armor for testing.
	 * @param {*} msg 
	 */
	async cmdRollWeap( msg ) {

		let char = await this.activeCharOrErr( msg, msg.author )
		if ( char == null ) return;

		try {

			let gen = require( './items/itemgen.js' );
			let it = gen.genWeapon();

			msg.reply( char.name + ' rolled a shiny new ' + it.name );
			char.addItem(it);
			this.saveChar( char, true );

		} catch ( e) { msg.reply( 'Massive unknown error!!!'); console.log(e);}

	}

	/**
	 * Roll a new armor for testing.
	 * @param {Message} msg 
	 */
	async cmdRollArmor( msg ) {

		let char = await this.activeCharOrErr( msg, msg.author )
		if ( char == null ) return;

		try {

			let gen = require( './items/itemgen.js' );
			let it = gen.genArmor();

			msg.reply( char.name + ' rolled a shiny new ' + it.name );
			char.addItem(it);
			this.saveChar( char, true );

		} catch ( e) { msg.reply( 'Massive unknown error!!!'); console.log(e);}

	}

	async cmdUnequip( msg, slot ) {

		let char = await this.activeCharOrErr( msg, msg.author )
		if ( char == null ) return;

		if ( slot == null ){
			msg.reply( 'You must specify an equip slot to remove.');
		} else {

			if ( char.unequip(slot) ) {
				msg.reply( 'Removed.')
			} else{
				msg.reply( 'Cannot unequip from ' + slot );
			}

		}

	}

	async cmdEquip( msg, what ) {

		let char = await this.activeCharOrErr( msg, msg.author )
		if ( char == null ) return;

		if ( what === null ) {

			msg.reply('```' + char.name + ' equip:\n' + char.listEquip() + '```');

		} else {

			let res = char.equip(what);
			if ( res === true ){
				msg.reply( char.name + ' equips ' + what );
			} else if ( typeof(res) === 'string') {
				msg.reply( res );
			} else {
				msg.reply( char.name + ' does not have ' + what );
			}

		}

	}

	async cmdWorn( msg, slot ) {

		let char = await this.activeCharOrErr( msg, msg.author )
		if ( char == null ) return;

		if ( slot == null ) display.sendBlock( msg, char.name + ' equip:\n' + char.listEquip() );
		else {

			let item = char.getEquip( slot );
			if ( item == null ) {

				msg.reply( 'Nothing equipped in ' + slot + ' slot.');
			} else if ( typeof(item) === 'string' ) {
				msg.reply( item );

			} else {
				msg.reply( item.getDetails() );
			}

		} //

	}

	async cmdEat( msg, what ) {

		let char = await this.activeCharOrErr( msg, msg.author )
		if ( char == null ) return;

		let resp =  char.eat( what );
		msg.reply( resp );

	}

	async cmdCook( msg, what ) {

		let char = await this.activeCharOrErr( msg, msg.author )
		if ( char == null ) return;

		let resp = char.cook( what );
		msg.reply( resp );

	}

	async cmdInscribe( msg, whichItem, inscrip ) {

		let char = await this.activeCharOrErr( msg, msg.author )
		if ( char == null ) return;

		if ( whichItem == null ) msg.reply( 'Which item in inventory do you want to inspect?');
		else {

			let item = char.getItem( whichItem );
			if ( item == null ) msg.reply( 'Item not found.');
			else {

				item.inscription = inscrip;
				msg.reply( 'Item inscribed.');
				this.saveChar( char );

			}

		} //

	}

	async cmdDestroy( msg, whichItem ) {

		let char = await this.activeCharOrErr( msg, msg.author )
		if ( char == null ) return;

		if ( whichItem == null ) msg.reply( 'Which inventory item do you want to obliterate?');
		else {

			let item = char.takeItem( whichItem );
			if ( item == null ) msg.reply( 'Item ' + whichItem + ' not in inventory.');
			else {

				msg.reply( item.name + ' is gone forever.' );

			}

		} //

	}

	async cmdInspect( msg, whichItem ) {

		let char = await this.activeCharOrErr( msg, msg.author )
		if ( char == null ) return;

		if ( whichItem == null ) msg.reply( 'Which inventory item do you want to inspect?');
		else {

			let item = char.getItem( whichItem );
			if ( item == null ) msg.reply( 'Item not found.');
			else {

				msg.reply( item.getDetails() );

			}

		} //

	}

	async cmdCraft( msg, itemName, desc ) {

		let char = await this.activeCharOrErr( msg, msg.author )
		if ( char == null ) return;

		if ( itemName == null ) msg.reply( 'Crafted item must have name.');
		else if ( desc == null ) msg.reply( 'Crafted item must have a description.' );
		else {

			item.Craft( char, itemName, desc );
			this.saveChar( char );

		} //

	}

	async cmdInv( msg, who ) {

		var char;

		if ( who != null ) {

			char = await this.tryLoadChar( who );
			if ( char == null ) return;

		} else {

			char = await this.activeCharOrErr( msg, msg.author );
			if ( char == null ) {
				msg.reply( 'Character \'' + who + '\' not found.');
				return;
			}

		}

		msg.reply( '```' + char.name + ' Inventory:\n' + char.inv.getMenu() + '```' );

	}

	async cmdGive( msg, who, expr ) {

		let src = await this.activeCharOrErr( msg, msg.author );
		if ( src == null ) return;

		try {

			let dest = await this.tryLoadChar( who );
			if ( dest == null ) {
				msg.reply( '\'' + who + '\' not found on server.' );
			} else {

				let err = Trade.transfer( src, dest, expr );
				if ( err === null ) {

					msg.reply( 'Can\'t transfer from ' + src.name + ' to ' + dest.name + ' ' + err );

				} else if ( typeof(err) === 'string ' ) {
			
					msg.reply( err );

				} else {

					await this.saveChar( src, true );
					await this.saveChar( dest, true  );
					msg.reply( 'Transfer complete.');

				}

			}

		} catch ( e ) { console.log(e); }

	}

	async cmdRmChar( msg, charname=null ) {

		if ( charname == null ) charname = msg.author.username;
		try {

			let char;

			if ( charname == null ) {
				char = await this.activeCharOrErr( msg, msg.author );
				if ( char == null) return;
			} else {

				char = await this.tryLoadChar( charname );
				if ( char == null ) {
					msg.reply( charname + ' not found on server.');
					return;
				} 
			}

			if ( char.owner == null || char.owner == msg.author.id ) {

				// delete
				let key = this.getCharKey( charname );
				this._context.deleteKeyData( key );
				msg.reply( charname + ' deleted.' );

			} else {

				msg.reply( 'You do not have permission to delete ' + charname );
			}


		} catch ( e ) { console.log(e); }
	
	}

	async cmdViewChar( msg, charname=null ) {

		try {
	
			let char;

			if ( charname == null ) {
				char = await this.activeCharOrErr( msg, msg.author );
				if ( char == null) return;
			} else {
				char = await this.tryLoadChar( charname );
				if ( char == null ) {
					msg.reply( charname + ' not found on server. D:' );
					return;
				}
			}
			this.echoChar( msg.channel, char );
	
		} catch(e) {console.log(e);}

	}

	async cmdLoadChar( msg, charname=null ) {

		if ( charname == null ) charname = msg.author.username;
	
		try {
	
			let char = await this.tryLoadChar( charname );
			let prefix;
			if ( char == null ) {
				msg.reply( charname + ' not found on server. D:' );
				return;
			} else if ( char.owner !== msg.author.id ) {


				prefix = 'This is not your character.\n';
			} else {
				
				await this.setActiveChar( msg.author, char );
				prefix = 'Active character set.\n';
			}
	
			this.echoChar( msg.channel, char, prefix );

		} catch(e) {console.log(e);}
	
	}
	
	async cmdRollChar( msg, charname=null, racename=null, classname=null ) {

		try {
			
			let race = getRace( racename );
			if ( race == null ) {
				msg.reply( 'Race ' + racename + ' not found.' );
				return;
			}
			let charclass = getClass( classname );
			if ( charclass == null ) {
				msg.reply( 'Class ' + classname + ' not found.' );
				return;
			}

			let sex;
			if ( sex == null ) sex = Math.random() < 0.5 ? 'm' : 'f';

			if ( charname != null ) {
				let exists = await this.charExists(charname);
				if ( exists ) {
					msg.reply( 'Character ' + charname + ' already exists.' );
					return;
				}
			} else charname = await this.uniqueName( race, sex );

			let char = CharGen.genChar( msg.author.id, race, charclass, charname, null );
			console.log( 'char rolled: ' + char.name );

			await this.setActiveChar( msg.author, char );
			this.echoChar( msg.channel, char );
			await this.saveChar( char, true );	// await for catch.

		} catch ( e ){ console.log(e); }

	}
	
	async charExists( charname ) {

		try {
			let key = this.getCharKey( charname );
			return await this._context.cache.exists( key );
		} catch (e){console.log(e); }
		return false;

	}

	echoChar( chan, char, prefix = '' ) {
	
		let namestr = char.name + ' is a';
		let desc = char.getLongDesc();
		chan.send( prefix + '```' + namestr + ( isVowel(desc.charAt(0) )?'n ':' ') + desc + '```' );
	
	}
	
	async activeCharOrErr( m, user ) {

		let char = this.activeChars[user.id];
		if ( char != null ) return char;

		if ( this.lastChars == null ) await this.loadLastChars();

		let charname = this.lastChars[user.id];
		if ( charname == null ) {
			m.reply( 'No active character for: ' + user.username );
			return null;
		}

		char = await this.tryLoadChar( charname );
		if ( char == null ) {
			m.reply( 'Character \'' + charname + '\' no longer exists. Load new char.');
			return;
		}
		if ( char.owner != user.id ) {
			m.reply( 'Character \'' + charname + '\' is owned by someone else. Load a new character.');
			return;
		}

		return char;

	}

	async loadLastChars() {

		let lastjson = await this._context.fetchKeyData( LAST_CHARS );
		if ( lastjson ) {
			this.lastChars = lastjson;
			return lastjson;
		}
		this.lastChars = {};
		this._context.cacheKeyData( LAST_CHARS, this.lastChars );

	}

	async setActiveChar( user, char ) {

		if ( this.lastChars == null ) await this.loadLastChars();

		this.activeChars[user.id] = char;
		this.lastChars[user.id] = char.name;

		this._context.cacheKeyData( LAST_CHARS, this.lastChars );

	}

	cacheChar( char ) {
		this._context.cacheKeyData( this.getCharKey( char.name ), char );
	}

	async saveChar( char, forceSave=false ) {

		let key = this.getCharKey( char.name );

		console.log( 'char SAVE: ' + key );
		await this._context.storeKeyData( key, char, forceSave );

	}

	async tryLoadChar( charname ) {

		let key = this.getCharKey( charname );

		let data = this._context.getKeyData(key);
		if ( data == null ) {
			data = await this._context.fetchKeyData( key );
			if ( data == null ) return null;
		}

		if ( data instanceof Char ) {
			return data;
		}

		console.log('parsing JSON char: ' + charname );

		let char = Char.FromJSON( data, raceByName, classByName );
		//restore char so Char is returned next, not json.
		this._context.storeKeyData( key, char );

		return char;

	}

	getCharKey( charname ) {
		return this._context.getDataKey( RPG_DIR, charname );
	}

	async uniqueName( race, sex ) {

		let namegen = require( './namegen.js');
		var name;
		var taken;
		do {

			name = namegen.genName( race.name, sex );
			taken = await this.charExists( name );

		} while ( taken )

		return name;

	}

} // class

exports.init = function( bot ){

	console.log( 'rpg INIT' );

	// CHAR MANAGEMENT
	bot.addContextCmd( 'rollchar', '!rollchar [<charname>] [ <racename> <classname> ]',
		RPG.prototype.cmdRollChar, RPG, { maxArgs:3} );

	bot.addContextCmd( 'loadchar', '!loadchar <charname>',
		RPG.prototype.cmdLoadChar, RPG, { maxArgs:1}  );
	bot.addContextCmd( 'viewchar', '!viewchar <charname>',
		RPG.prototype.cmdViewChar, RPG, { maxArgs:1}  );
	bot.addContextCmd( 'rmchar', '!rmchar <charname>', RPG.prototype.cmdRmChar, RPG, {minArgs:1, maxArgs:1} );

	bot.addContextCmd( 'allchars', '!allchars\t\tList all character names on server.', RPG.prototype.cmdAllChars,
			RPG, {maxArgs:0} );

	// EQUIP
	bot.addContextCmd( 'equip', '!equip [what]\t\tEquips item from inventory, or displays all worn items.',
			RPG.prototype.cmdEquip, RPG, {minArgs:0, maxArgs:1} );
	bot.addContextCmd( 'unequip', '!unequip [equip slot]\t\tRemoves a worn item.',
				RPG.prototype.cmdUnequip, RPG, {minArgs:1, maxArgs:1} );
	bot.addContextCmd( 'worn', '!worn [equip slot]\t\tInspect an equipped item.', RPG.prototype.cmdWorn, RPG, {maxArgs:1});

	// ITEMS
	bot.addContextCmd( 'destroy', '!destroy <item_number|item_name>\t\tDestroys an item. This action cannot be undone.',
					RPG.prototype.cmdDestroy, RPG, {maxArgs:1});
	bot.addContextCmd( 'inspect', '!inspect {<item_number|item_name>', RPG.prototype.cmdInspect, RPG, {maxArgs:1});
	bot.addContextCmd( 'inscribe', '!inscribe {<item_number|item_name>} <inscription>', RPG.prototype.cmdInscribe, RPG, {maxArgs:2, group:"right"});
	bot.addContextCmd( 'inv', '!inv [player]', RPG.prototype.cmdInv, RPG, {maxArgs:1});
	bot.addContextCmd( 'craft', '!craft <item_name> <description>', RPG.prototype.cmdCraft, RPG, {maxArgs:2, group:"right"} );
	bot.addContextCmd( 'give', '!give <charname> <what>', RPG.prototype.cmdGive, RPG, { minArgs:2, maxArgs:2, group:"right"} );

	// FOOD
	bot.addContextCmd( 'eat', '!eat <what>\t\tEat something from your inventory.', RPG.prototype.cmdEat, RPG, {minArgs:1, maxArgs:1});
	bot.addContextCmd( 'cook', '!cook <what>\t\tCook an item in inventory.', RPG.prototype.cmdCook, RPG, {minArgs:1, maxArgs:1} );

	// TESTING
	bot.addContextCmd( 'rolldmg', '!rolldmg', RPG.prototype.cmdRollDmg, RPG, {hidden:true, maxArgs:0} );
	bot.addContextCmd( 'rollweap', '!rollweap', RPG.prototype.cmdRollWeap, RPG, {hidden:true, maxArgs:0} );
	bot.addContextCmd( 'rollarmor', '!rollarmor', RPG.prototype.cmdRollArmor, RPG, {hidden:true, maxArgs:0});

	// LOCATION
	bot.addContextCmd( 'look', '!look [item on ground]', RPG.prototype.cmdLook, RPG, { maxArgs:1 } );
	bot.addContextCmd( 'drop', '!drop <what>', RPG.prototype.cmdDrop, RPG, {minArgs:1, maxArgs:1});
	bot.addContextCmd( 'take', '!take <what>', RPG.prototype.cmdTake, RPG, {minArgs:1, maxArgs:1});
	bot.addContextCmd( 'locdesc', '!locdesc <description>', RPG.prototype.cmdLocDesc, RPG, {minArgs:1, maxArgs:1} );
	bot.addContextCmd( 'explored', '!explored', RPG.prototype.cmdExplored, RPG, {maxArgs:0} );
	bot.addContextCmd( 'sethome', '!sethome', RPG.prototype.cmdSetHome, RPG, {maxArgs:0});
	bot.addContextCmd( 'gohome', '!gohome', RPG.prototype.cmdGoHome, RPG, {maxArgs:0});

	bot.addContextCmd( 'move', '!move <direction>', RPG.prototype.cmdMove, RPG, {maxArgs:1});
	bot.addContextCmd( 'north', '!north', RPG.prototype.cmdMove, RPG, { maxArgs:0, args:['north'] } );
	bot.addContextCmd( 'south', '!south', RPG.prototype.cmdMove, RPG, { maxArgs:0, args:['south'] } );
	bot.addContextCmd( 'east', '!east', RPG.prototype.cmdMove, RPG, { maxArgs:0, args:['east'] } );
	bot.addContextCmd( 'west', '!west', RPG.prototype.cmdMove, RPG, { maxArgs:0, args:['west'] } );

}

function isVowel( lt ) {
	return lt === 'a' || lt === 'e' || lt === 'i' || lt === 'o' || lt === 'u';
}

function initRaces() {

	try {

		let a = require( './data/races.json');

		exports.Races = races = [];
		exports.RaceByName = raceByName = {};

		let raceObj, race;
		for( let i = a.length-1; i>= 0; i-- ) {

			raceObj = a[i];
			race = Race.FromJSON( raceObj );
			raceByName[ race.name ] = race;
			races.push( race );

		}


	} catch (e){
		console.log(e);
	}

}

function getRace( racename ) {
	if ( racename == null || !raceByName.hasOwnProperty(racename) ) return util.randElm(races);
	return raceByName[racename.toLowerCase()];
}

function getClass( classname ) {
	if ( classname == null || !classByName.hasOwnProperty(classname) ) return util.randElm(classes);
	return classByName[classname.toLowerCase()];
}

function initClasses() {

	try {

		let a = require( './data/classes.json');

		exports.Classes = classes = [];
		exports.ClassByName = classByName = {};

		let classObj, charclass;
		for( let i = a.length-1; i>= 0; i-- ) {

			classObj = a[i];
			charclass = CharClass.FromJSON( classObj );
			classByName[ charclass.name ] = charclass;
			classes.push( charclass );

		}


	} catch (e){
		console.log(e);
	}

}