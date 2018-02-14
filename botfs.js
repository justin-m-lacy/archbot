const path = require( 'path');
const fsj = require( './async_fs.js');

const BASE_DIR = './savedata/';
const SERVERS_DIR = 'guilds/';
const CHANNELS_DIR = 'channels/'
const GAMES_DIR = 'games';
const PLUGINS_DIR = 'plugins/';
const USERS_DIR = 'users/';

exports.readData = readData;
exports.writeData = writeData;
exports.memberPath = getMemberPath;
exports.userPath = getUserPath;

exports.pluginDir = getPluginDir;
exports.getPluginFile = getPluginFile;


async function readData( relPath ) {
	return await fsj.readJSON( path.join( BASE_DIR, relPath + '.json' ) );
}

async function writeData( relPath, data ) {

	let absPath = path.join( BASE_DIR, relPath );

	await fsj.mkdir( path.dirname( absPath ) );
	await fsj.writeJSON( absPath + '.json', data );

}

function getPluginFile( plugname, file, guild ) {
	if ( guild == null ) return path.join( PLUGINS_DIR, plugname, file );
	return path.join( PLUGINS_DIR, guild.id, plugname, file )

}

function getPluginDir( plugname, guild ) {
	if ( guild == null ) return path.join( PLUGINS_DIR, plugname );
	return path.join( PLUGINS_DIR, guild.id, plugname );
}

// path to guild storage.
function getGuildDir( guild ) {
	if ( guild == null ) return SERVERS_DIR;
	return path.join( SERVERS_DIR, guild.id );
}

// path to user not in guild.
function getUserPath( user ) {

	if ( user == null ) return '';
	return path.join( USERS_DIR, user.id );

}

// path to member's base guild file.
function getMemberPath( member ) {

	if ( member == null ) return '';
	if ( member.guild == null ) return '';

	let gid = member.guild.id;

	return path.join( SERVERS_DIR, gid, (member.id) );

}