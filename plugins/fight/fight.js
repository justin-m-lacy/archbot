var results;
var bot;

exports.init = function( bot ) {

	bot.dispatch.add( 'fight', cmdFight, 1,1, '!fight [user]' );

}

function cmdFight( msg, uname ) {

	if ( results == null ) results = require( './results.json');

	let ind = Math.floor(results.length*Math.random() );
	let result = results[ind];

	let attacker = msg.hasOwnProperty( member ) ? msg.member.displayName : msg.author.username;


	msg.channel.send( results[ind] );

}