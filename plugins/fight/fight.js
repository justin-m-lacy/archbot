var results;
var bot;

exports.init = function( mainbot ) {

	bot = mainbot;
	mainbot.dispatch.add( 'fight', cmdFight, 1,1, '!fight [user]' );

}

function cmdFight( msg, uname ) {

	if ( results == null ) results = require( './results.json');

	let target = bot.tryGetUser( msg.channel, uname );
	if ( target == null ) {
		msg.channel.send( 'I don\'t see ' + uname + ' here. Are you feeling okay?');
		return;
	}
	if ( target.hasOwnProperty('username') && target.username == msg.author.username ||
		target.hasOwnProperty('user') && target.user.username == msg.author.username ) {

		msg.channel.send( 'You attacked yourself. And lost.' );
		return;
	}

	let ind = Math.floor(results.length*Math.random() );
	let result = results[ind];

	let attacker = msg.hasOwnProperty( 'member' ) ? msg.member.displayName : msg.author.username;

	result = result.replace( /%t/g, uname );
	result = result.replace( /%a/g, attacker );

	msg.channel.send( result );

}