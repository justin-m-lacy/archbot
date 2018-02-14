const u = require('./jsutils.js');

const classes = [ 'wizard', 'fighter', 'ranger', 'rogue', 'druid', 'barbarian', 'priest', 'monk'];
const races = [ 'elf','half-elf', 'dwarf', 'human', 'gnome', 'halfling', 'half-orc'];


function cmdRollChar( msg, charname ) {

	let cl = u.randElm( classes );
	let race = u.randElm( races );

}

function initChar( char ) {

	char.level = 1;
	char.hp = Math.floor( char.charClass.HD + char.race.HD )/2;

}