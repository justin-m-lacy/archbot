const path = require( 'path');
const afs = require( '../afs.js');

const GUILDS_DIR = 'guilds/';
const CHANNELS_DIR = 'channels/'
const USERS_DIR = 'users/';

var BASE_DIR = './savedata/';


async function deleteData( relPath ) {
	return await afs.deleteFile( BASE_DIR + '/' + relPath + '.json');
}

async function readData( relPath ) {
	return await afs.readJSON( path.join( BASE_DIR, relPath + '.json' ) );
}

async function writeData( relPath, data ) {

	let absPath = path.join( BASE_DIR, relPath[0] === '/' ? relPath.slice(1) : relPath );

	await afs.mkdir( path.dirname( absPath ) );
	await afs.writeJSON( absPath + '.json', data );

}

function getChannelDir( chan ) {
	if ( chan == null ) return CHANNELS_DIR;
	return CHANNELS_DIR + channel.id + '/';
}

// path to guild storage.
function getGuildDir( guild ) {
	if ( guild == null ) return GUILDS_DIR;
	return GUILDS_DIR + guild.id + '/';
}

function getUserDir( user ) {
	if ( user == null ) return USERS_DIR;
	return USERS_DIR + user.id + '/';
}

// path to user not in guild.
function getUserPath( user ) {

	if ( user == null ) return '';
	return USERS_DIR + user.id;

}

// path to member's base guild file.
function getMemberPath( member ) {

	if ( member == null ) return '';
	if ( member.guild == null ) return '';

	let gid = member.guild.id;

	return GUILDS_DIR + gid + '/' + (member.id);

}

module.exports = {

	readData:readData,
	writeData:writeData,
	deleteData:deleteData,

	userPath:getUserPath,
	memberPath:getMemberPath,

	getUserDir:getUserDir,
	getGuildDir:getGuildDir,
	getChannelDir:getChannelDir,

	illegalChars:[ '/', '\\', ':', '*', '?', '"', '|', '<', '>'],

	getBaseDir() {
		return BASE_DIR;
	},
	setBaseDir(v) {
		BASE_DIR = v;
	},

	fileExists:async (filePath) => {
		return await( afs.exists( BASE_DIR + filePath + '.json') );
	},

	guildPath:(guild, subs )=> {

		if ( guild == null ) return GUILDS_DIR;

		let thepath = GUILDS_DIR + guild.id;
		if ( subs == null ) return thepath;

		let len = subs.length;
		let subobj;

		for( let i = 0; i < len; i++ ) {
			subobj = subs[i];

			if ( typeof(subobj) == 'string' ) {
				thepath += '/' + subobj.toLowerCase();
			} else {
				thepath += '/' + subobj.id;
			}
		}

		return thepath;

	},

	channelPath:( chan, subs ) => {
		if ( chan == null ) return CHANNELS_DIR;

		let thepath = CHANNELS_DIR + chan.id;
		if ( subs == null ) return thepath;
		let len = subs.length;

		let subobj;
		for( let i = 0; i < len; i++ ) {
			subobj = subs[i];
			if ( typeof(subobj) == 'string' ) {
				thepath += '/' + subobj.toLowerCase();
			} else {
				thepath += '/' + subobj.id;
			}
		}

		return thepath;
	}

};