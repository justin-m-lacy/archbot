const u = require('../../jsutils.js');
const Char = exports.Char = require( './char.js');
const Race = exports.Race = require( './race.js');
const CharClass = exports.CharClass = require( './charclass.js' );

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

		context.bindCommand( 'rollchar', this );
		context.bindCommand( 'loadchar', this );

	}

	async cmdListChars( msg, uname=null ) {
	}
	
	async cmdDeleteChar( msg, charname ) {
	
	}

	async cmdLoadChar( msg, charname=null ) {

		if ( !initialized ) initData();

		if ( charname == null ) charname = msg.author.username;
	
		try {
	
			let char = await this.tryLoadChar( msg.channel, msg.author, charname );
			if ( char == null ) {
				msg.channel.send( charname + ' not found on server. D:' );
				return;
			}
	
			this.echoChar( msg.channel, char );
	
		} catch(e) {console.log(e);}
	
	}
	
	async cmdRollChar( msg, charname=null, racename=null, classname=null ) {
	
		if ( !initialized ) initData();
	
		console.log( "INSTANCE ROLLCHAR" );

		try {

			let charclass, race;
			
			if ( racename != null )racename = racename.toLowerCase();
			if ( racename != null && raceByName.hasOwnProperty(racename)) race = raceByName[racename];
			else race = u.randElm( races );
			
			if ( classname != null ) classname = classname.toLowerCase();
			if ( classname != null && classByName.hasOwnProperty(classname)) charclass = classByName[classname];
			else charclass = u.randElm( classes );
		
			if ( charname == null ) charname = msg.author.username;

			let exists = await this.charExists(charname);
			if ( exists ) {
				msg.channel.send( 'Character ' + charname + ' already exists.' );
				return;
			}

			console.log( 'new character');

			let char = new Char();
			char.rollNew(  charname, race, charclass );

			console.log( 'char rolled: ' + char.name );

			this.echoChar( msg.channel, char );
			await this.trySaveChar( msg.author, char );

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

			let data = await this._context.fetchKeyData( key );
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
		return this._context.getDataKey( 'RPG', charname );
	}

} // class

exports.init = function( discordbot ){

	bot = discordbot;
	console.log( 'rpg INIT' );

	let cmds = bot.dispatch;
	cmds.add( 'rollchar', '!rollchar {charname} {racename} {classname}',
		RPG.prototype.cmdRollChar, { type:'instance', maxArgs:3} );
	cmds.add( 'loadchar', '!loadchar {charname}', RPG.prototype.cmdLoadChar,
		{type:'instance', maxArgs:1}  );

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

		races = [];
		raceByName = {};

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

function initClasses() {

	if ( classes != null ) return;

	try {

		let a = require( './data/classes.json');

		classes = [];
		classByName = {};

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