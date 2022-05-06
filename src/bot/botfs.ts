import path from 'path';
import afs from '../afs';

/**
 * @constant {string} GUILDS_DIR
 */
const GUILDS_DIR = 'guilds/';

/**
 * @constant {strnig} PLUGINS_DIR - directory for plugin-level savedata.
 * Data that is constant for all instances of a plugin.
 */
const PLUGINS_DIR = 'plugins/';

/**
 * @constant {string} CHANNELS_DIR
 */
const CHANNELS_DIR = 'channels/'

/**
 * @constant {string} USERS_DIR
 */
const USERS_DIR = 'users/';

/**
 * @var {string} BASE_DIR - base directory for all data saves.
 */
var BASE_DIR = './savedata';


/**
 *
 * @param {string} relPath
 * @returns {Promise<boolean>}
 */
async function deleteData(relPath) {
	return afs.deleteFile(path.join(BASE_DIR, relPath + '.json'));
}

/**
 *
 * @param {string} relPath
 * @returns {Promise<*>}
 */
async function readData(relPath) {
	return afs.readJSON(path.join(BASE_DIR, relPath + '.json'));
}

/**
 *
 * @param {string} relPath
 * @param {*} data - data to be JSON-encoded.
 * @returns {Promise<*>}
 */
async function writeData(relPath, data) {

	try {

		let absPath = path.join(BASE_DIR, relPath[0] === '/' ? relPath.slice(1) : relPath);

		await afs.mkdir(path.dirname(absPath));
		return afs.writeJSON(absPath + '.json', data);

	} catch (e) {
		console.error('Failed to write data: ' + e.toString());
	}

}

/**
 *
 * @param {string} chan
 * @returns {string}
 */
function getChannelDir(chan) {
	if (!chan) return CHANNELS_DIR;
	return CHANNELS_DIR + channel.id + '/';
}

/**
 * Gets path to guild storage.
 * @param {Guild} guild
 * @returns {string}
 */
function getGuildDir(guild) {
	if (guild == null) return GUILDS_DIR;
	return GUILDS_DIR + guild.id + '/';
}

/**
 *
 * @param {User} user
 * @returns {string} User storage directory.
 */
function getUserDir(user) {
	if (user == null) return USERS_DIR;
	return USERS_DIR + user.id + '/';
}

/**
 * Save-path for a user outside of a guild.
 * @param {string} user
 * @returns {string}
 */
function getUserPath(user) {

	if (user == null) return '';
	return USERS_DIR + user.id;

}

/**
 * path to member's base guild file.
 * @param {string} member
 * @returns {string}
 */
function getMemberPath(member) {

	if (!member || !member.guild) return '';
	return GUILDS_DIR + member.guild.id + '/' + (member.id);

}

module.exports = {

	readData: readData,
	writeData: writeData,
	deleteData: deleteData,

	userPath: getUserPath,
	memberPath: getMemberPath,

	getUserDir: getUserDir,
	getGuildDir: getGuildDir,
	getChannelDir: getChannelDir,

	/**
	 *
	 * @param {string} plugin
	 */
	getPluginDir(plugin) {

		if (!plugin) return BASE_DIR + PLUGINS_DIR;
		return BASE_DIR + PLUGINS_DIR + plugin + '/';

	},

	/**
	 * @property {string[]} illegalChars
	 */
	illegalChars: ['/', '\\', ':', '*', '?', '"', '|', '<', '>'],

	getBaseDir() {
		return BASE_DIR;
	},
	setBaseDir(v) {
		BASE_DIR = v + '/';
	},

	fileExists: async (filePath) => {
		return afs.exists(BASE_DIR + filePath + '.json');
	},

	guildPath: (guild, subs) => {

		if (guild == null) return GUILDS_DIR;

		let thepath = GUILDS_DIR + guild.id;
		if (subs == null) return thepath;

		let len = subs.length;
		let subobj;

		for (let i = 0; i < len; i++) {
			subobj = subs[i];

			if (typeof (subobj) == 'string') {
				thepath += '/' + subobj.toLowerCase();
			} else {
				thepath += '/' + subobj.id;
			}
		}

		return thepath;

	},

	channelPath: (chan, subs) => {
		if (chan == null) return CHANNELS_DIR;

		let thepath = CHANNELS_DIR + chan.id;
		if (subs == null) return thepath;
		let len = subs.length;

		let subobj;
		for (let i = 0; i < len; i++) {
			subobj = subs[i];
			if (typeof (subobj) == 'string') {
				thepath += '/' + subobj.toLowerCase();
			} else {
				thepath += '/' + subobj.id;
			}
		}

		return thepath;
	}

};