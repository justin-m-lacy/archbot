var responses;

exports.init = function( bot ) {

	bot.addCmd( 'who', 'who <condition>', cmdWho, {maxArgs:1} );

}

const getResponse = ()=> {
	return responses[ Math.floor( Math.random()*responses.length ) ];
}

/**
 * @async
 * @param {Message} m
 * @param {string} msg - ignored question.
 * @returns {Promise}
 */
async function cmdWho( m ) {

	if ( !responses ) responses = require( './responses.json');
	if ( responses.length === 0 ) return;

	let resp = getResponse();
	let t = m.channel.type;
	let u, name;

	if ( t === 'text' || t === 'voice') {

		u = m.guild.members.cache.random();
		name = u.displayName;

	} else return m.channel.send( 'It\'s you, I guess.' );

	return m.channel.send( resp.replace( /%t/g, name ));

}