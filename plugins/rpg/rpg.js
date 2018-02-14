const u = require('./jsutils.js');

const classes = [ 'wizard', 'fighter', 'ranger', 'rogue', 'druid', 'barbarian', 'priest', 'monk'];
const races = [ 'elf','half-elf', 'dwarf', 'human', 'gnome', 'halfling', 'half-orc'];

var bot;

exports.init = function( discordbot ){

	bot = discordbot;
	console.log( 'rpg INIT' );

	let cmds = bot.dispatch;
	cmds.add( 'rollchar', cmdRollChar, 0, 0, '!rollchar' );

}

function cmdRollChar( msg, charname=null ) {

	let charclass = u.randElm( classes );
	let race = u.randElm( races );

	msg.channel.send( 'You are a' + ( isVowel(race.charAt(0) )?'n':'') + ' ' + race + ' ' + charclass  );

}

function isVowel( lt ) {
	return lt === 'a' || lt === 'e' || lt === 'i' || lt === 'o' || lt === 'u';
}

function initChar( char ) {

	char.level = 1;
	char.hp = Math.floor( char.charClass.HD + char.race.HD )/2;

}