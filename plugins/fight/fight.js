var results;
var bot;

exports.init = function( mainbot ) {

	bot = mainbot;
	mainbot.dispatch.add( 'fight', '!fight [user]', cmdFight, {maxArgs:1}  );

}

function cmdFight( msg, uname ) {

	if ( results == null ) results = require( './results.json');

	if ( uname == null ) {
		msg.channel.send( 'You attack the darkness!');
		return;
	}
	let target = bot.tryGetUser( msg.channel, uname );
	if ( target == null ) {
		msg.channel.send( 'I don\'t see ' + uname + ' here. Are you feeling okay?');
		return;
	}
	if ( target.presence.status == 'offline') {
		let attacker = msg.hasOwnProperty( 'member' ) ? msg.member.displayName : msg.author.username;
		msg.channel.send( attacker + ' is only brave enough to fight ' + uname + ' when they aren\'t here. How sad.' );
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