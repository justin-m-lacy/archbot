const jimp = require( 'jimp' );
const colorRE = /^(?:\#|0x)([a-f|\d]{1,6})\b/i;
const Discord = require( 'discord.js');

const IMG_SIZE = 16;

exports.init = function( bot ) {

	bot.dispatch.add( 'color', 'color color', cmdColor, { minArgs:1, maxArgs:1} );
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

		return img ? imageBuffer( img ) : null;

	} catch(e) { return null; }

}

/**
 *
 * @param {} color
 * @returns {Promise<Jimp>}
 */
function makeImage( color ) {

	return new Promise( (res)=>{

		new jimp( IMG_SIZE, IMG_SIZE, color, (err,image)=>{

			err ? res(null) : res(image);

		});

	});

}

/**
 * Wraps image.getBuffer() in a promise to make awaitable.
 * @param {Jimp} img
 * @returns {Promise<Buffer|null>}
 */
async function imageBuffer( img ) {

	return new Promise( (res)=>{
		img.getBuffer( jimp.MIME_PNG, (err, buff)=>{

			res( err ? null : buff );

		} );
	});

}