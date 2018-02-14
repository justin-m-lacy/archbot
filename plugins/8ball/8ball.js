var answers;

exports.init = function( bot ) {

	bot.dispatch.add( '8ball', cmd8Ball, 1,1, '!8ball [question]' );

}

function cmd8Ball( msg, query ) {

	if ( answers == null ) answers = require( './answers.json');

	let ind = Math.floor(answers.length*Math.random() );
	msg.channel.send( answers[ind] );

}