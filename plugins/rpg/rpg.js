var initialized = false;

// includes after init.
var util, Char, Race, CharClass, CharGen, Item, Trade;

var races, raceByName;
var classes, classByName;

// created for each discord context.
var RPG = exports.ContextClass = class {

	constructor( context ) {

		this._context = context;
		console.log( "Creating RPG instance.");

		this.loadedChars = {};

		// active chars by user id.
		this.activeChars = {};

	}

	async cmdListChars( msg, uname=null ) {
	}

	cmdInscribe( msg, whichItem, inscrip ) {

		if ( !initialized) initData();

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

	cmdInspect( msg, whichItem ) {

		if ( !initialized) initData();

		let char = this.activeCharOrErr( msg.channel, msg.author )
		if ( char == null ) return;

		if ( whichItem == null ) msg.channel.send( 'Which item in inventory do you want to inspect?');
		else {

			let item = char.getItem( whichItem );
			if ( item == null ) msg.channel.send( 'Item not found.');
			else {

				msg.channel.send( item.getDetails() );

			}

		} //

	}

	cmdCraft( msg, itemName, desc ) {

		if ( !initialized) initData();

		let char = this.activeCharOrErr( msg.channel, msg.author )
		if ( char == null ) return;

		if ( itemName == null ) msg.channel.send( 'Crafted item must have name.');
		else if ( desc == null ) msg.channl.send( 'Crafted item must have a description.' );
		else {

			let item = new Item( itemName, desc );
			char.addItem( item );

			this.trySaveChar( char );

		} //

	}

	cmdInv( msg ) {

		if ( !initialized) initData();

		let char = this.activeCharOrErr( msg.channel, msg.author )
		if ( char == null ) return;

		msg.channel.send( char.name + '\nInventory:\n' + char.inv.getList() );

	}

	async cmdGive( msg, destname, expr ) {

		if ( !initialized) initData();

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

		// must init to load char for owner check.
		if ( !initialized ) initData();

		if ( charname == null ) charname = msg.author.username;
		try {

			let char = await this.tryLoadChar( charname );
			if ( char == null ) {
				msg.channel.send( charname + ' not found on server.');

			} else if ( char.owner == null || char.owner == msg.author.id ) {

				// delete
				let key = this.getCharKey( charname );
				delete this.loadedChars[ key ];
				this._context.deleteKeyData( key );
				msg.channel.send( charname + ' deleted.' );

			} else {

				msg.channel.send( 'You do not have permission to delete ' + charname );
			}


		} catch ( e ) { console.log(e); }
	
	}

	async cmdViewChar( msg, charname=null ) {

		if ( !initialized ) initData();

		if ( charname == null ) charname = msg.author.username;
	
		try {
	
			let char = await this.tryLoadChar( charname );
			if ( char == null ) {
				msg.channel.send( charname + ' not found on server. D:' );

			} else this.echoChar( msg.channel, char );
	
		} catch(e) {console.log(e);}

	}

	async cmdLoadChar( msg, charname=null ) {

		if ( !initialized ) initData();

		if ( charname == null ) charname = msg.author.username;
	
		try {
	
			let char = await this.tryLoadChar( charname );
			if ( char == null ) {
				msg.channel.send( charname + ' not found on server. D:' );
				return;
			} else if ( char.owner !== msg.author.id ) {


				msg.channel.send( 'This is not your character.');
			} else {
				
				this.setActiveChar( msg.author, char );
				msg.channel.send( 'Active character set.');
			}
	
			this.echoChar( msg.channel, char );

		} catch(e) {console.log(e);}
	
	}
	
	async cmdRollChar( msg, charname=null, racename=null, classname=null ) {
	
		if ( !initialized ) initData();

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

	echoChar( chan, char ) {
	
		let namestr = char.name + ' is a';
		let desc = char.getLongDesc();
		chan.send( namestr + ( isVowel(desc.charAt(0) )?'n ':' ') + desc );
	
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

		try {

			let data = await this._context.fetchKeyData( key );
			if ( data instanceof Char ) {
				console.log('Char Found: ' + data.name );
				return data;
			}

			console.log('parsing JSON char: ' + charname );
			let char = Char.FromJSON( data, raceByName, classByName );
			return char;

		} catch ( err ){
			console.log(err );
		}
		return null;

	}

	getCharKey( charname ) {
		return this._context.getDataKey( 'rpg', charname );
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

	bot.addContextCmd( 'rollchar', '!rollchar [<charname>] [ <racename> <classname> ]',
		RPG.prototype.cmdRollChar, RPG, { maxArgs:3} );

	bot.addContextCmd( 'loadchar', '!loadchar <charname>',
		RPG.prototype.cmdLoadChar, RPG, { maxArgs:1}  );
	bot.addContextCmd( 'viewchar', '!viewchar <charname>',
		RPG.prototype.cmdViewChar, RPG, { maxArgs:1}  );
	bot.addContextCmd( 'rmchar', '!rmchar <charname>', RPG.prototype.cmdRmChar, RPG, {minArgs:1, maxArgs:1} );

	bot.addContextCmd( 'inspect', '!inspect {<item_number|item_name>', RPG.prototype.cmdInspect, RPG, {maxArgs:1});
	bot.addContextCmd( 'inscribe', '!inscribe {<item_number|item_name>} <inscription>', RPG.prototype.cmdInscribe, RPG, {maxArgs:2});
	bot.addContextCmd( 'inv', '!inv', RPG.prototype.cmdInv, RPG, {maxArgs:0});
	bot.addContextCmd( 'craft', '!craft <item_name> <description>', RPG.prototype.cmdCraft, RPG, {maxArgs:3, group:"right"} );
	bot.addContextCmd( 'give', '!give <charname> <what>', RPG.prototype.cmdGive, RPG, { minArgs:2, maxArgs:2, group:"right"} );

}

function isVowel( lt ) {
	return lt === 'a' || lt === 'e' || lt === 'i' || lt === 'o' || lt === 'u';
}

function initData() {

	initialized = true;

	util = require('../../jsutils.js');
	Char = exports.Char = require( './char.js');
	Race = exports.Race = require( './race.js');
	CharClass = exports.CharClass = require( './charclass.js' );	
	CharGen = require( './chargen.js' );
	Item = require( './items/item.js' );
	Trade = require ( './trade.js' );

	initRaces();
	initClasses();

}

function initRaces() {

	if ( races != null ) return;

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

	if ( classes != null ) return;

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