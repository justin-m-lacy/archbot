var responses;

exports.init = function( bot ) {

	bot.addCmd( 'who', '!who <condition>', cmdWho, {maxArgs:1} );

}

function cmdWho( m, msg ) {

	if ( responses == null ){
		responses = require( './responses.json');
	}

	let resp = getResponse();
	let t = m.channel.type;
	let u, name;

	if ( t == 'text' || t == 'voice') {

		u = m.guild.members.random();
		name = u.displayName;

	} else if ( t == 'group') {

		u = m.channel.recipients.random();
		name = u.username;

	} else {
		m.channel.send( 'It\'s you, moron.' );
		return;
	}

	m.channel.send( resp.replace( /%t/g, name ));

}

function getResponse() {
	return responses[ Math.floor( Math.random()*responses.length ) ];
}