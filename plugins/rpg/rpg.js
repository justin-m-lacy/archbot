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
exports.ContextClass = new class {

	constructor( context ) {

		this._context = context;
		console.log( "Creating RPG instance.")
	}

}


exports.init = function( discordbot ){

	bot = discordbot;
	console.log( 'rpg INIT' );

	let cmds = bot.dispatch;
	cmds.add( 'rollchar', '!rollchar {charname} {racename} {classname}', cmdRollChar, {maxArgs:3} );
	cmds.add( 'loadchar', '!loadchar {charname}', cmdLoadChar, {maxArgs:1}  );

}

async function cmdListChars( msg, uname=null ) {
}

async function cmdDeleteChar( msg, charname ) {

}

async function cmdLoadChar( msg, charname=null ) {

	if ( !initialized ) initData();
	if ( charname == null ) charname = msg.author.username;

	try {

		let char = await tryLoadChar( msg.channel, msg.author, charname );
		if ( char == null ) {
			msg.channel.send( charname + ' not found on server. D:' );
			return;
		}

		echoChar( msg.channel, char );

	} catch(e) {console.log(e);}

}

async function cmdRollChar( msg, charname=null, racename=null, classname=null ) {

	if ( !initialized ) initData();

	let charclass, race;
	
	if ( racename != null )racename = racename.toLowerCase();
	if ( racename != null && raceByName.hasOwnProperty(racename)) race = raceByName[racename];
	else race = u.randElm( races );
	
	if ( classname != null ) classname = classname.toLowerCase();
	if ( classname != null && classByName.hasOwnProperty(classname)) charclass = classByName[classname];
	else charclass = u.randElm( classes );

	if ( charname == null ) charname = msg.author.username;

	try {
		let key = getCharKey( msg.channel, msg.author, charname );
		let exists = await bot.cache.exists( key );
		if ( exists ) {
			msg.channel.send( 'Character ' + charname + ' already exists.' );
			return;
		}
	} catch (e){console.log(e);return; }

	let char = new Char();
	char.rollNew(  charname, race, charclass );

	echoChar( msg.channel, char );
	trySaveChar( msg.channel, msg.author, char );
	
}

function echoChar( chan, char ) {

	let namestr = char.name + ' is a';

	let desc = char.getLongDesc();

	chan.send( namestr + ( isVowel(desc.charAt(0) )?'n ':' ') + desc );

}

async function trySaveChar( chan, user, char ) {

	let key = getCharKey( chan, user, char.name );

	console.log( 'char save key: ' + key );
	try {
		await bot.storeKeyData( key, char );
	} catch (err) {
		console.log(err);
	}

}

async function tryLoadChar( chan, user, charname) {

	let key = getCharKey( chan, user, charname );

	try {

		let data = await bot.fetchKeyData( key );
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

function getCharKey( chan, user, charname ) {

	let type = chan.type;
	if ( type == 'text' || type == 'voice ') {
		return bot.getDataKey( chan.guild, user, charname );
	} else {
		return bot.getDataKey( chan, user, charname );
	}

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