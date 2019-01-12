const jimp = require( 'jimp' );
const colorRE = /^(?:\#|0x)([a-f|\d]{1,6})\b/i;
const Discord = require( 'discord.js');

const IMG_SIZE = 16;

exports.init = function( bot ) {

	bot.dispatch.add( 'color', '!color color', cmdColor, { minArgs:1, maxArgs:1} );
}

async function cmdColor( msg, colorStr ) {

	let result = colorRE.exec( colorStr );
	let colorNum = result ? Number.parseInt( result[1], 16 ) : Number(colorStr );

	if ( isNaN(colorNum)) return msg.reply('Invalid Color Format: ' + colorStr );

	let embed = {
		// clear high bits.
		color:colorNum & 0x00FFFFFF,
		description:colorStr
	};
	let data = await imgData( colorNum );

	if ( !data ) return msg.reply( {embed:embed} );
	else {
		embed.file = {attachment:data};
		return msg.reply( {embed:new Discord.RichEmbed( embed )} );
	}

}

async function imgData( color ) {

	try {

		// set alpha to full.
		let img = await makeImage(
			jimp.rgbaToInt(
				color >> 16,
				0xff & (color>>8),
				color&0xff,
				0xff
			 )
		);
		if ( !img ) return null;

		return await imageBuffer( img );

	} catch(e) { return null; }

}

function makeImage( color ) {

	return new Promise( (res)=>{

		let j = new jimp( IMG_SIZE, IMG_SIZE, color, (err,image)=>{

			if ( err ) res(null);
			res(image);

		});

	});

}

/**
 * Wraps image.getBuffer() in a promise to make awaitable.
 * @param {*} img 
 */
async function imageBuffer( img ) {

	return new Promise( (res,rej)=>{
		img.getBuffer( jimp.MIME_PNG, (err, buff)=>{
			if ( err ) res(null);
			else res( buff );
		} );
	});

}