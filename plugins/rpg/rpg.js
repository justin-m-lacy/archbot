const u = require('./jsutils.js');
const Char = exports.Char = require( './char.js');
const Race = exports.Race = require( './race.js');
const CharClass = exports.CharClass = require( './charclass.js' );

var initialized = false;

var classes;
var races;

var bot;

exports.init = function( discordbot ){

	bot = discordbot;
	console.log( 'rpg INIT' );

	let cmds = bot.dispatch;
	cmds.add( 'rollchar', cmdRollChar, 0, 0, '!rollchar' );

}

function initData() {

	initialized = true;

	initRaces();
	initClasses();

}

function initRaces() {

	let a = [];

	a.push( new Race( "elf", 7, {'str':-2, 'wis':2, 'dex':2 } ) );
	a.push( new Race( 'half-elf', 8, {} ) );
	a.push( new Race( 'dwarf', 10, {'con':2, 'wis':2, 'dex':-2} ) );
	a.push( new Race( 'human', 8, {} ) );
	a.push( new Race( 'gnome', 7, {'str':-4, 'int':2, 'con':2} ) );
	a.push( new Race( 'halfling', 6, {'str':-2, 'dex':1, 'int':1, 'chr':1, 'wis':1, 'con':1} ) );
	a.push( new Race( 'half-orc', 10, { 'str':3, 'int':-2, 'chr':-2, 'con':2 } ) );
	a.push( new Race( 'orc', 14, { 'str':4, 'int':-3, 'con':2, 'wis':-2} ) );
	a.push( new Race( 'fairy', 4, { 'str':-6, 'int':4, 'dex':4, 'chr':2 } ) );
	a.push( new Race( 'troll', 20, { 'str':6, 'con':4, 'int':-4, 'wis':-4, 'chr':-4 } ) );
	a.push( new Race( 'pixie', 2, {  'str':-8, 'int':2, 'dex':6, 'chr':2 }  ) );

	races = a;

}

function initClasses() {

	let a = [];

	a.push( new CharClass( 'wizard', 6 ) );
	a.push( new CharClass( 'fighter', 10 ) );
	a.push( new CharClass( 'ranger', 8 ) );
	a.push( new CharClass( 'rogue', 6 ) );
	a.push( new CharClass( 'druid', 8 ) );
	a.push( new CharClass( 'barbarian', 12 ) );
	a.push( new CharClass( 'priest', 6 ) );
	a.push( new CharClass( 'bard', 6 ) );
	a.push( new CharClass( 'monk', 8 ) );

	classes = a;

}

function cmdRollChar( msg, charname=null ) {

	if ( !initialized ) initData();

	let charclass = u.randElm( classes );
	let race = u.randElm( races );

	let char = new Char( charname, race, charclass );
	let namestr = charname != null ? charname + ' is a' : 'You are a';

	let desc = char.getLongDesc();

	msg.channel.send( namestr + ( isVowel(desc.charAt(0) )?'n ':' ') + desc );

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