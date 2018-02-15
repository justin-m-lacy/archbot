const u = require('./jsutils.js');
const Char = exports.Char = require( './char.js');
const Race = exports.Race = require( './race.js');
const CharClass = exports.CharClass = require( './charclass.js' );

var initialized = false;

var classes;
var classByName;

var classes;
var classByName;

var bot;

exports.init = function( discordbot ){

	bot = discordbot;
	console.log( 'rpg INIT' );

	let cmds = bot.dispatch;
	cmds.add( 'rollchar', cmdRollChar, 0, 3, '!rollchar {charname} {racename} {classname}' );
	cmds.add( 'loadchar', cmdLoadChar, 0, 1,  '!loadchar {charname}' );

}

function initData() {

	initialized = true;

	initRaces();
	initClasses();

}

function initRaces() {

	if ( classes != null ) return;

	try {

		let a = require( './data/races.json');

		classes = [];
		classByName = {};

		let raceObj, race;
		for( let i = a.length-1; i>= 0; i-- ) {

			raceObj = a[i];
			race = Race.FromJSON( raceObj );
			classByName[ race.name ] = race;
			classes.push( race );

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

function cmdRollChar( msg, charname=null, racename=null, classname=null ) {

	if ( !initialized ) initData();

	let charclass, race;
	
	if ( racename != null && classByName.hasOwnProperty(racename)) race = classByName[racename];
	else race = u.randElm( classes );
	
	if ( classname != null && classByName.hasOwnProperty(classname)) charclass = classByName[classname];
	else charclass = u.randElm( classes );

	if ( charname == null ) charname = msg.author.username;
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

	let type = chan.type;
	let key;
	if ( type == 'text' || type == 'voice ') {
		key = bot.getDataKey( chan.guild, user, char.name );
	} else {
		key = bot.getDataKey( chan, user, char.name );
	}

	console.log( 'char save key: ' + key );
	try {
		await bot.storeKeyData( key, char );
	} catch (err) {
		console.log(err);
	}

}

async function tryLoadChar( chan, user, charname) {

	let type = chan.type;
	let key;
	if ( type == 'text' || type == 'voice ') {
		key = bot.getDataKey( chan.guild, user, charname );
	} else {
		key = bot.getDataKey( chan, user, charname );
	}

	try {

		let data = await bot.fetchKeyData( key );
		if ( data instanceof Char ) {
			console.log('already char.');
			return data;
		}

		console.log('parsing json char' );
		let char = Char.FromJSON( data, classByName, classByName );
		return char;

	} catch ( err ){
		console.log(err );
	}
	return null;

}

function getModifier( stat ) {
	return Math.floor( ( stat - 10)/2 );
}

function isVowel( lt ) {
	return lt === 'a' || lt === 'e' || lt === 'i' || lt === 'o' || lt === 'u';
}

function initChar( char ) {

	char.level = 1;
	char.hp = Math.floor( char.charClass.HD + char.race.HD )/2;

}