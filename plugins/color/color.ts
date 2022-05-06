import Discord, { Message } from 'discord.js';
import jimp from 'jimp';
import { DiscordBot } from '../../src/bot/discordbot';

const colorRE = /^(?:\#|0x)([a-f|\d]{1,6})\b/i;


const IMG_SIZE = 16;

export const init = (bot: DiscordBot) => {

	bot.dispatch.add('color', 'color color', cmdColor, { minArgs: 1, maxArgs: 1 });
}

const cmdColor = async (msg: Message, colorStr: string) => {

	let result = colorRE.exec(colorStr);
	let colorNum = result ? Number.parseInt(result[1], 16) : Number(colorStr);

	if (isNaN(colorNum)) return msg.reply('Invalid Color Format: ' + colorStr);

	let embed = {
		// clear high bits.
		color: colorNum & 0x00FFFFFF,
		description: colorStr,
	};
	let data = await imgData(colorNum);

	if (!data) return msg.reply({ embeds: [embed] });
	else {
		return msg.reply({

			files: [data],
			embeds: [new Discord.MessageEmbed(embed)]
		});
	}

}

const imgData = async (color: number) => {

	try {

		// set alpha to full.
		let img = await makeImage(
			jimp.rgbaToInt(
				color >> 16,
				0xff & (color >> 8),
				color & 0xff,
				0xff
			)
		);

		return img ? imageBuffer(img) : null;

	} catch (e) { return null; }

}

/**
 *
 * @param {} color
 * @returns {Promise<Jimp>}
 */
const makeImage = (color: number): Promise<jimp | null> => {

	return new Promise((res) => {

		new jimp(IMG_SIZE, IMG_SIZE, color, (err, image) => {

			err ? res(null) : res(image);

		});

	});

}

/**
 * Wraps image.getBuffer() in a promise to make awaitable.
 * @param {Jimp} img
 * @returns {Promise<Buffer|null>}
 */
const imageBuffer = (img: jimp): Promise<Buffer | null> => {

	return new Promise((res) => {
		img.getBuffer(jimp.MIME_PNG, (err, buff) => {

			res(err ? null : buff);

		});
	});

}