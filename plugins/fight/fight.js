const Discord = require( 'discord.js' );

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

	let target = bot.findUser( msg.channel, uname );
	let attacker = msg.hasOwnProperty( 'member' ) ? msg.member.displayName : msg.author.username;

	if ( target == null ) {

		msg.channel.send( 'I don\'t see ' + uname + ' here. So you must be talking to me. Are you talking to me?');

	} else if ( target.presence.status == 'offline') {
		msg.channel.send( attacker + ' is only brave enough to fight ' + uname + ' when they aren\'t here. How sad.' );

	} else if ( target.id == msg.author.id ) {
		
		msg.channel.send( attacker + ' self flagellates in public.' );

	} else if ( target.id == bot.client.user.id ) {
		msg.channel.send( bot.client.user.username + ' throws down ' + attacker + ' and smites his ruin upon the mountainside.');

	} else {

		let ind = Math.floor(results.length*Math.random() );
		let result = results[ind];

		result = result.replace( /%t/g, uname );
		result = result.replace( /%a/g, attacker );

		msg.channel.send( result );

	}

}