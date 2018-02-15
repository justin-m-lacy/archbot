const u = require('./jsutils.js');
const Char = exports.Char = require( './char.js');
const Race = exports.Race = require( './race.js');
const CharClass = exports.CharClass = require( './charclass.js' );

var initialized = false;

var classes;
var classByName;

var races;
var raceByName;

var bot;

exports.init = function( discordbot ){

	bot = discordbot;
	console.log( 'rpg INIT' );

	let cmds = bot.dispatch;
	cmds.add( 'rollchar', cmdRollChar, 0, 1, '!rollchar {charname}' );
	cmds.add( 'loadchar', cmdLoadChar, 0, 1,  '!loadchar {charname}' );

}

function initData() {

	initialized = true;

	initRaces();
	initClasses();

}

function initRaces() {

	let a = [];

	a.push( new Race( "elf", 7, { 'str':-2, 'wis':2, 'dex':2 } ) );
	a.push( new Race( 'half-elf', 8, {} ) );
	a.push( new Race( 'dwarf', 10, {'con':2, 'wis':2, 'dex':-2} ) );
	a.push( new Race( 'human', 8, {} ) );
	a.push( new Race( 'gnome', 7, {'str':-4, 'int':3, 'con':2} ) );
	a.push( new Race( 'halfling', 6, {'str':-2, 'dex':2, 'int':1, 'chr':1, 'wis':1, 'con':1} ) );
	a.push( new Race( 'half-orc', 10, { 'str':3, 'int':-2, 'chr':-2, 'con':2 } ) );
	a.push( new Race( 'orc', 14, { 'str':4, 'int':-3, 'con':2, 'wis':-2} ) );
	a.push( new Race( 'fairy', 4, { 'str':-6, 'int':4, 'dex':4, 'chr':2 } ) );
	a.push( new Race( 'troll', 20, { 'str':6, 'con':4, 'int':-4, 'wis':-4, 'chr':-4 } ) );
	a.push( new Race( 'half-troll', 18, { 'str':5, 'con':3, 'int':-3, 'wis':-3, 'chr':-3 } ) );
	a.push( new Race( 'pixie', 2, { 'str':-8, 'int':2, 'dex':6, 'chr':2 }  ) );
	a.push( new Race( 'minotaur', 14, { 'str':2, 'con':2, 'int':-2, 'dex':-2, 'wis':2, 'chr':-2 }  ) );
	a.push( new Race( 'centaur', 2, { 'dex':2, 'wis':2, 'chr':-2 }  ) );
	a.push( new Race( 'goblin', 6, { 'str':-2, 'wis':-3, 'dex':2, 'int':2, 'chr':-2 }  ) );
	a.push( new Race( 'kobold', 6, { 'str':-2, 'wis':-2, 'dex':3, 'chr':-2 }  ) );
	a.push( new Race( 'demigod', 14, { 'str':8, 'con':8, 'dex':8, 'int':8, 'wis':8, 'chr':8 }  ) );

	raceByName = {};
	for( let i = a.length-1; i>= 0; i-- ){
		raceByName[ a[i].name ] = a[i];
	}

	races = a;

}

function initClasses() {

	let a = [];

	a.push( new CharClass( 'wizard', 6 ) );
	a.push( new CharClass( 'sorcerer', 6 ) );
	a.push( new CharClass( 'witch', 6 ) );
	a.push( new CharClass( 'fighter', 10 ) );
	a.push( new CharClass( 'ranger', 8 ) );
	a.push( new CharClass( 'rogue', 6 ) );
	a.push( new CharClass( 'druid', 8 ) );
	a.push( new CharClass( 'paladin', 8 ) );
	a.push( new CharClass( 'barbarian', 12 ) );
	a.push( new CharClass( 'priest', 6 ) );
	a.push( new CharClass( 'bard', 6 ) );
	a.push( new CharClass( 'monk', 8 ) );

	classByName = {};
	for( let i = a.length-1; i>= 0; i-- ){
		classByName[ a[i].name ] = a[i];
	}

	classes = a;

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

function cmdRollChar( msg, charname=null ) {

	if ( !initialized ) initData();

	let charclass = u.randElm( classes );
	let race = u.randElm( races );

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
		let char = new Char();
		char.initJSON( data, raceByName, classByName );
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