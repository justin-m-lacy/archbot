const util = require('../../jsutils.js');
const Char = exports.Char = require( './char.js');
const Race = exports.Race = require( './race.js');
const CharClass = exports.CharClass = require( './charclass.js' );
const CharGen = require( './chargen.js' );

var initialized = false;

var races;
var raceByName;

var classes;
var classByName;

var bot;

// created for each discord context.
var RPG = exports.ContextClass = class {

	constructor( context ) {

		this._context = context;
		console.log( "Creating RPG instance.");

		this.loadedChars = {};

	}

	async cmdListChars( msg, uname=null ) {
	}
	
	async cmdRmChar( msg, charname=null ) {

		// must init to load char for owner check.
		if ( !initialized ) initData();

		if ( charname == null ) charname = msg.author.username;
		try {

			let char = await this.tryLoadChar( msg.author, charname );
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

	async cmdLoadChar( msg, charname=null ) {

		if ( !initialized ) initData();

		if ( charname == null ) charname = msg.author.username;
	
		try {
	
			let char = await this.tryLoadChar( msg.author, charname );
			if ( char == null ) {
				msg.channel.send( charname + ' not found on server. D:' );
				return;
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
			} else charname = await this.uniqueName( racename, sex );

			console.log( 'trying name: ' + charname );

			let char = CharGen.genChar( msg.author.id, race, charclass, charname, null );
			console.log( 'char rolled: ' + char.name );

			this.echoChar( msg.channel, char );
			await this.trySaveChar( msg.author, char );	// await for catch.

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
	
	async trySaveChar( user, char ) {

		let key = this.getCharKey( char.name );

		console.log( 'char save key: ' + key );
		try {
			await this._context.storeKeyData( key, char );
		} catch (err) {
			console.log(err);
		}

	}

	async tryLoadChar( user, charname) {

		let key = this.getCharKey( charname );

		try {


			let data = this.loadedChars[key];
			if ( data ) return data;

			data = await this._context.fetchKeyData( key );
			if ( data instanceof Char ) {
				console.log('already char.');
				return data;
			}

			console.log('parsing json char' );
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

			name = namegen.genName( race, sex );
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
	bot.addContextCmd( 'rmchar', '!rmchar <charname>', RPG.prototype.cmdRmChar, RPG, {minArgs:1, maxArgs:1} );

}

function isVowel( lt ) {
	return lt === 'a' || lt === 'e' || lt === 'i' || lt === 'o' || lt === 'u';
}

function initData() {

	initialized = true;

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