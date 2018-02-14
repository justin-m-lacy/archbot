const answers = require( './answers.json');

exports.init = function( bot ) {

	bot.dispatch.add( '8ball', cmd8Ball, 1,1, '!8ball [question]' );

}

function cmd8Ball( msg, query ) {

	let ind = Math.floor(answers.length*Math.random() );
	msg.channel.send( answers[ind] );

}