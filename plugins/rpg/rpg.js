var initialized = false;

// includes after init.
var util, Char, Race, CharClass, CharGen, Item, Trade, World;

const RPG_DIR = 'rpg';

var races, raceByName;
var classes, classByName;

function initData() {

	initialized = true;

	util = require('../../jsutils.js');
	Char = exports.Char = require( './char.js');
	Race = exports.Race = require( './race.js');
	CharClass = exports.CharClass = require( './charclass.js' );	
	CharGen = require( './chargen.js' );
	Item = require( './items/item.js' );
	Trade = require ( './trade.js' );
	World = require( './world/world.js');

	initRaces();
	initClasses();

}

// created for each discord context.
var RPG = exports.ContextClass = class {

	/**
	 * 
	 * @param {botcontext.Context} context 
	 */
	constructor( context ) {

		this._context = context;
		console.log( "Creating RPG instance.");

		if ( !initialized) initData();

		// active chars by user id.
		this.activeChars = {};

		this.world = new World( this._context.cache );

	}

	async cmdAllChars( msg, uname=null ) {

		try {
			let list = await this._context.getDataList(RPG_DIR );
			if ( list == null ) msg.channel.send( 'An unknown error has occurred. Oopsie.');
			else {
				msg.channel.send( list.join(', ') );
			}
		} catch(e) { console.log(e);}

	}

	cmdMove( msg, dir ) {

		let char = this.activeCharOrErr( msg.channel, msg.author )
		if ( char == null ) return;

		if ( dir == null ) {
			msg.channel.send( 'Must specify movement direction for ' + char.name + '.' );
		} else {
		}

	}

	/**
	 * Roll damage test with current weapon.
	 * @param {*} msg 
	 */
	cmdRollDmg( msg ) {

		let char = this.activeCharOrErr( msg.channel, msg.author )
		if ( char == null ) return;

		msg.channel.send( 'Weapon roll for ' + char.name + ': ' + char.testDmg() );

	}

		/**
	 * Roll a new armor for testing.
	 * @param {*} msg 
	 */
	cmdRollWeap( msg ) {

		let char = this.activeCharOrErr( msg.channel, msg.author )
		if ( char == null ) return;

		try {

			let gen = require( './items/itemgen.js' );
			let it = gen.genWeapon();

			msg.channel.send( char.name + ' rolled a shiny new ' + it.name );
			char.addItem(it);
			this.trySaveChar( char, true );

		} catch ( e) { msg.channel.send( 'Massive unknown error!!!'); console.log(e);}

	}

	/**
	 * Roll a new armor for testing.
	 * @param {Message} msg 
	 */
	cmdRollArmor( msg ) {

		let char = this.activeCharOrErr( msg.channel, msg.author )
		if ( char == null ) return;

		try {

			let gen = require( './items/itemgen.js' );
			let it = gen.genArmor();

			msg.channel.send( char.name + ' rolled a shiny new ' + it.name );
			char.addItem(it);
			this.trySaveChar( char, true );

		} catch ( e) { msg.channel.send( 'Massive unknown error!!!'); console.log(e);}

	}

	cmdUnequip( msg, slot ) {

		let char = this.activeCharOrErr( msg.channel, msg.author )
		if ( char == null ) return;

		if ( slot == null ){
			msg.channel.send( 'You must specify an equip slot to remove.');
		} else {

			if ( char.unequip(slot) ) {
				msg.channel.send( 'Removed.')
			} else{
				msg.channel.send( 'Cannot unequip from ' + slot );
			}

		}

	}

	cmdEquip( msg, what ) {

		let char = this.activeCharOrErr( msg.channel, msg.author )
		if ( char == null ) return;

		if ( what === null ) {

			msg.channel.send('```' + char.name + ' equip:\n' + char.listEquip() + '```');

		} else {

			let res = char.equip(what);
			if ( res === true ){
				msg.channel.send( char.name + ' equips ' + what );
			} else if ( typeof(res) === 'string') {
				msg.channel.send( res );
			} else {
				msg.channel.send( char.name + ' does not have ' + what );
			}

		}

	}

	cmdWorn( msg, slot ) {

		let char = this.activeCharOrErr( msg.channel, msg.author )
		if ( char == null ) return;

		if ( slot == null ) msg.channel.send('```' + char.name + ' equip:\n' + char.listEquip() + '```');
		else {

			let item = char.getEquip( slot );
			if ( item == null ) {

				msg.channel.send( 'Nothing equipped in ' + slot + ' slot.');
			} else if ( typeof(item) === 'string' ) {
				msg.channel.send( item );

			} else {
				msg.channel.send( item.getDetails() );
			}

		} //

	}

	cmdEat( msg, what ) {

		let char = this.activeCharOrErr( msg.channel, msg.author )
		if ( char == null ) return;

		let resp =  char.eat( what );
		msg.channel.send( resp );

	}

	cmdCook( msg, what ) {

		let char = this.activeCharOrErr( msg.channel, msg.author )
		if ( char == null ) return;

		let resp = char.cook( what );
		msg.channel.send( resp );

	}

	cmdInscribe( msg, whichItem, inscrip ) {

		let char = this.activeCharOrErr( msg.channel, msg.author )
		if ( char == null ) return;

		if ( whichItem == null ) msg.channel.send( 'Which item in inventory do you want to inspect?');
		else {

			let item = char.getItem( whichItem );
			if ( item == null ) msg.channel.send( 'Item not found.');
			else {

				item.inscription = inscrip;
				msg.channel.send( 'Item inscribed.');
				this.trySaveChar( char );

			}

		} //

	}

	cmdDestroy( msg, whichItem ) {

		let char = this.activeCharOrErr( msg.channel, msg.author )
		if ( char == null ) return;

		if ( whichItem == null ) msg.channel.send( 'Which inventory item do you want to obliterate?');
		else {

			let item = char.takeItem( whichItem );
			if ( item == null ) msg.channel.send( 'Item ' + whichItem + ' not in inventory.');
			else {

				msg.channel.send( item.name + ' is gone forever.' );

			}

		} //

	}

	cmdInspect( msg, whichItem ) {

		let char = this.activeCharOrErr( msg.channel, msg.author )
		if ( char == null ) return;

		if ( whichItem == null ) msg.channel.send( 'Which inventory item do you want to inspect?');
		else {

			let item = char.getItem( whichItem );
			if ( item == null ) msg.channel.send( 'Item not found.');
			else {

				msg.channel.send( item.getDetails() );

			}

		} //

	}

	cmdCraft( msg, itemName, desc ) {

		let char = this.activeCharOrErr( msg.channel, msg.author )
		if ( char == null ) return;

		if ( itemName == null ) msg.channel.send( 'Crafted item must have name.');
		else if ( desc == null ) msg.channl.send( 'Crafted item must have a description.' );
		else {

			let item = new Item.Item( itemName, desc );
			char.addItem( item );

			this.trySaveChar( char );

		} //

	}

	cmdInv( msg ) {

		let char = this.activeCharOrErr( msg.channel, msg.author )
		if ( char == null ) return;

		msg.channel.send( '```' + char.name + ' Inventory:\n' + char.inv.getList() + '```' );

	}

	async cmdGive( msg, destname, expr ) {

		let src = this.activeCharOrErr( msg.channel, msg.author );
		if ( src == null ) return;

		try {

			let dest = await this.tryLoadChar( destname );
			if ( dest == null ) {
				msg.channel.send( '\'' + destname + '\' not found on server.' );
			} else {

				let err = Trade.transfer( src, dest, expr );
				if ( err === null ) {

					msg.channel.send( 'Can\'t transfer from ' + src.name + ' to ' + dest.name + ' ' + err );

				} else if ( typeof(err) === 'string ' ) {
			
					msg.channel.send( err );

				} else {

					await this.trySaveChar( src, true );
					await this.trySaveChar( dest, true  );
					msg.channel.send( 'Transfer complete.');

				}

			}

		} catch ( e ) { console.log(e); }

	}

	async cmdRmChar( msg, charname=null ) {

		if ( charname == null ) charname = msg.author.username;
		try {

			let char;

			if ( charname == null ) {
				char = this.activeCharOrErr( msg.channel, msg.author );
				if ( char == null) return;
			} else {

				char = await this.tryLoadChar( charname );
				if ( char == null ) {
					msg.channel.send( charname + ' not found on server.');
					return;
				} 
			}

			if ( char.owner == null || char.owner == msg.author.id ) {

				// delete
				let key = this.getCharKey( charname );
				this._context.deleteKeyData( key );
				msg.channel.send( charname + ' deleted.' );

			} else {

				msg.channel.send( 'You do not have permission to delete ' + charname );
			}


		} catch ( e ) { console.log(e); }
	
	}

	async cmdViewChar( msg, charname=null ) {

		try {
	
			let char;

			if ( charname == null ) {
				char = this.activeCharOrErr( msg.channel, msg.author );
				if ( char == null) return;
			} else {
				char = await this.tryLoadChar( charname );
				if ( char == null ) {
					msg.channel.send( charname + ' not found on server. D:' );
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
				msg.channel.send( charname + ' not found on server. D:' );
				return;
			} else if ( char.owner !== msg.author.id ) {


				prefix = 'This is not your character.\n';
			} else {
				
				this.setActiveChar( msg.author, char );
				prefix = 'Active character set.\n';
			}
	
			this.echoChar( msg.channel, char, prefix );

		} catch(e) {console.log(e);}
	
	}
	
	async cmdRollChar( msg, charname=null, racename=null, classname=null ) {

		try {
			
			let race = getRace( racename );
			if ( race == null ) {
				msg.channel.send( 'Race ' + racename + ' not found.' );
				return;
			}
			let charclass = getClass( classname );
			if ( charclass == null ) {
				msg.channel.send( 'Class ' + classname + ' not found.' );
				return;
			}

			let sex;
			if ( sex == null ) sex = Math.random() < 0.5 ? 'm' : 'f';

			if ( charname != null ) {
				let exists = await this.charExists(charname);
				if ( exists ) {
					msg.channel.send( 'Character ' + charname + ' already exists.' );
					return;
				}
			} else charname = await this.uniqueName( race, sex );

			console.log( 'trying name: ' + charname );

			let char = CharGen.genChar( msg.author.id, race, charclass, charname, null );
			console.log( 'char rolled: ' + char.name );

			this.setActiveChar( msg.author, char );
			this.echoChar( msg.channel, char );
			await this.trySaveChar( char, true );	// await for catch.

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
	
	activeCharOrErr( chan, user ) {

		let char = this.activeChars[user.id];
		if ( char == null ) chan.send( 'No active character for: ' + user.username );
		return char;

	}

	setActiveChar( user, char ) {
		this.activeChars[user.id] = char;
	}

	async trySaveChar( char, forceSave=false ) {

		let key = this.getCharKey( char.name );

		console.log( 'char SAVE: ' + key );
		try {
			await this._context.storeKeyData( key, char, forceSave );
		} catch (err) {
			console.log(err);
		}

	}

	async tryLoadChar( charname ) {

		let key = this.getCharKey( charname );

		let data = this._context.getKeyData(key);
		if ( data == null ) {
			data = await this._context.fetchKeyData( key );
			if ( data == null ) return null;
		}

		if ( data instanceof Char ) {
			console.log('Char Found: ' + data.name );
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
	bot.addContextCmd( 'inv', '!inv', RPG.prototype.cmdInv, RPG, {maxArgs:0});
	bot.addContextCmd( 'craft', '!craft <item_name> <description>', RPG.prototype.cmdCraft, RPG, {maxArgs:2, group:"right"} );
	bot.addContextCmd( 'give', '!give <charname> <what>', RPG.prototype.cmdGive, RPG, { minArgs:2, maxArgs:2, group:"right"} );

	// FOOD
	bot.addContextCmd( 'eat', '!eat <what>\t\tEat something from your inventory.', RPG.prototype.cmdEat, RPG, {minArgs:1, maxArgs:1});
	bot.addContextCmd( 'cook', '!cook <what>\t\tCook an item in inventory.', RPG.prototype.cmdCook, RPG, {minArgs:1, maxArgs:1} );

	//
	bot.addContextCmd( 'rolldmg', '!rolldmg', RPG.prototype.cmdRollDmg, RPG, {hidden:true, maxArgs:0} );
	bot.addContextCmd( 'rollweap', '!rollweap', RPG.prototype.cmdRollWeap, RPG, {hidden:true, maxArgs:0} );
	bot.addContextCmd( 'rollarmor', '!rollarmor', RPG.prototype.cmdRollArmor, RPG, {hidden:true, maxArgs:0});

	// MOVEMENT
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