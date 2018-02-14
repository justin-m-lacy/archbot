var Discord = require( 'discord.js');
var auth = require('./auth.json');
var fsys = require( './botfs.js');

const fs = require( 'fs' );

const path = require( 'path' );
const Cmd = require( './commands.js');
const dformat = require( './datedisplay.js' );
const Dice = require( './dice.js' );
const jsutils = require( './jsutils.js' );

const PLUGINS_DIR = './plugins/';
const CmdPrefix = '!';

function initCache() {

	var cacher = require ( './cache.js' );
	let cache = new cacher.Cache( 250, fsys.readData, fsys.writeData );
	return cache;

}

function initReactions() {

	let React = require( './reactions.js');
	let reactData = require('./reactions.json');
	return new React.Reactions( reactData );
}

function initCmds(){ 

	let cmds = new Cmd.Dispatch( CmdPrefix );
	
	cmds.add( 'schedule', cmdSchedule, 2, 2, '!schedule [activity] [times]', 'right');
	cmds.add( 'sleep', cmdSleep, 1, 1, '!sleep [sleep schedule]');
	cmds.add( 'when', cmdWhen, 2, 2, '!when [userName] [activity]');
	cmds.add( 'roll', cmdRoll, 1,1, '!roll [n]d[s]');

	cmds.add( 'uid', cmdUid, 1,1, '!uid [username]' );
	cmds.add( 'uname', cmdUName, 1,1, '!uname [nickname]' );
	cmds.add( 'nick', cmdNick, 1,1, '!nick [displayName]' );
	
	cmds.add( 'lastplay', cmdLastPlay, 2, 2, '!lastplay [userName] [gameName]');
	cmds.add( 'laston', cmdLastOn, 1, 1, '!laston [userName]');
	cmds.add( 'lastactive', cmdLastActive, 1, 1, '!lastactive [userName]');
	cmds.add( 'lastoff', cmdLastOff, 1, 1, '!lastoff [userName]');

	cmds.add( 'offtime', cmdOffTime, 1,1, '!offtime [userName]');
	cmds.add( 'ontime', cmdOnTime, 1,1, '!ontime [username]');

	cmds.add( 'test', cmdTest, 1, 1, '!test [ping message]');

	return cmds;

}

function loadPlugins() {

	let plugins = {};

	try {

	dirs = fs.readdirSync( PLUGINS_DIR );
	let file, dir, stats;
	for( let dir of dirs ) {

		dir = path.resolve( PLUGINS_DIR, dir );
		stats = fs.statSync( dir );
		if ( !stats.isDirectory() ) continue;
		let files = fs.readdirSync( dir );
		for( let file of files ) {

			if ( !(path.extname(file) === '.json')) continue;
			file = path.resolve( dir, file );
			stats = fs.statSync( file );
			if ( !stats.isFile() ) continue;
			// desc file.
			loadPlugin( dir, file, plugins);

		}

	}
} catch (err){
	console.log(err);
}

	return plugins;

}

// load plugin described by json.
function loadPlugin( dir, descPath, plugins ){

	try {

		console.log( 'loading: ' + descPath );

		let data = fs.readFileSync( descPath );
		let desc = JSON.parse(data);

		if ( desc.hasOwnProperty( 'plugin')){

			let plugFile = path.join( dir, desc.plugin );
			let plugName = desc.hasOwnProperty('name') ? desc.name : plugFile;
			let plugin = plugins[plugName] = require( plugFile );

		}

	} catch ( err ){
		console.log( err );
	}

}

// init bot
var bot = new Discord.Client( {} );

var reactions = initReactions();
var dispatch = initCmds();
var cache = initCache();

var plugins = loadPlugins();

bot.on( 'ready', function(evt) {
    console.log('Scheduler Connected: ' + bot.username + ' - (' + bot.id + ')');
});

bot.on( 'message', doMsg );
bot.on( 'presenceUpdate', presenceChanged );
bot.on( 'error', doError );

bot.login( auth.token );

process.on( 'exit', onShutdown );
process.on( 'SIGINT', onShutdown );


function doError( err ) {
	console.log( 'Connection error: ' + err.message );
}

function onShutdown() {
	if ( bot != null ) {
		bot.destroy();
		bot = null;
	}
}


function doMsg( msg ) {

	if ( msg.author.id == bot.user.id ) return;
	if ( !msg.hasOwnProperty('guild') || msg.guild == null) return;

	try {

		let content = msg.content;

		if ( content.substring(0,1) === CmdPrefix ) {

			doCommand( msg );

		} else {

			let reaction = reactions.react( content );
			if ( reaction != null ) {
				msg.channel.send( reaction );
			}

		}

	} catch ( exp ) {
		console.error( exp );
	}

}

function doCommand( msg ) {

	let error = dispatch.process( msg.content, [msg] );

	if ( error )
		msg.channel.send( error );

}

function cmdUName( msg, name ) {

	let gMember = tryGetUser( msg.channel, name );
	if ( !gMember ) return;
	msg.channel.send( name + ' user name: ' + gMember.user.username )

}

function cmdNick( msg, name ) {

	let gMember = tryGetUser( msg.channel, name );
	if ( !gMember ) return;
	msg.channel.send( name + ' nickname: ' + gMember.nickname )

}

function cmdUid( msg, name ) {

	let gMember = tryGetUser( msg.channel, name );
	if ( !gMember ) return;
	msg.channel.send( name + ' uid: ' + gMember.user.id )

}

function cmdRoll( msg, dice ) {

	let total = Dice.Roller.roll( dice );
	msg.channel.send( msg.member.displayName + ' rolled ' + total );

}

function cmdSleep( msg, when ) {
	setSchedule( msg.member, 'sleep', when );
}
function cmdSchedule( msg, activity, when ) {

	console.log( 'scheduling: ' + activity + ' at: ' + when );
	setSchedule( msg.member, activity, when );
	msg.channel.send( 'Scheduled ' + activity + ' for ' + msg.member.displayName );

}

function cmdWhen( msg, who, activity ) {
	sendSchedule( msg.channel, who, activity );
}

function cmdLastPlay( msg, who, game ){
	sendGameTime( msg.channel, who, game );
}

function cmdLastOn( msg, who ){
	sendHistory( msg.channel, who, ['online','idle','dnd'], 'online' );
}

function cmdLastActive( msg, who ){
	sendHistory( msg.channel, who, 'online', 'active' );
}

function cmdLastOff( msg, who ){
	sendHistory( msg.channel, who, 'offline', 'offline' );
}

function cmdTest( msg, reply ){
	msg.channel.send( reply + ' yourself, ' + msg.member.displayName );
}

async function sendGameTime( channel, displayName, gameName ) {
	
	let gMember = tryGetUser( channel, displayName );
	if ( !gMember ) return;

	if ( gMember.presence.game != null && gMember.presence.game.name === gameName ) {
		channel.send( displayName + ' is playing ' + gameName );
		return;
	}

	try {

		let data = await fetchMemberData( gMember );
		let games = data.games;

		let dateStr = dformat.DateDisplay.recent( games[gameName] );
		channel.send( displayName + ' last played ' + gameName + ' ' + dateStr );

	} catch ( err ) {
		channel.send( gameName + ': No record for ' + displayName + ' found.' );
	}

}

async function cmdOnTime( msg, name ) {

	let chan = msg.channel;
	let gMember = tryGetUser( chan, name );
	if ( !gMember ) return;

	if ( hasStatus(gMember, 'offline') ) {
		chan.send( name + ' is not online.' );
		return;
	}

	try {

		let history = await readHistory(gMember);
		if ( history != null ) {

			let lastTime = latestStatus( history, 'offline' );

			if ( lastTime != null ){
				chan.send( name + ' has been online for ' + dformat.DateDisplay.elapsed( lastTime ) );
				return;
			}

		}
		chan.send( 'No online record for ' + name );

	} catch ( err ){
		chan.send( 'No online record for ' + name );
		console.log( err );
	}

}

async function cmdOffTime( msg, name ) {

	let chan = msg.channel;
	let gMember = tryGetUser( chan, name );
	if ( !gMember ) return;

	if ( !hasStatus(gMember, 'offline') ) {
		chan.send( name + ' is not offline.' );
		return;
	}

	try {

		let history = await readHistory(gMember);
		if ( history != null ) {

			let lastTime = latestStatus( history, 'offline' );

			if ( lastTime != null ){
				chan.send( name + ' has been offline for ' + dformat.DateDisplay.elapsed( lastTime ) );
				return;
			}

		}
		chan.send( 'No offline record for ' + name );

	} catch ( err ){
		chan.send( 'No offline record for ' + name );
		console.log( err );
	}

}

// send status history of user to channel.
// statuses is a single status string or array of valid statuses
// statusName is the status to display in channel.
async function sendHistory( channel, name, statuses, statusName ) {

	let gMember = tryGetUser( channel, name );
	if ( !gMember ) return;

	if ( hasStatus(gMember, statuses ) ) {

		channel.send( name + ' is now ' + statusName );
		return;

	}

	try {

		let memData = await fetchMemberData( gMember );
		let lastTime = latestStatus( memData.history, statuses );

		let dateStr = dformat.DateDisplay.recent( lastTime );
		if ( statusName == null ) statusName = evtType;
		channel.send( 'Last saw ' + name + ' ' + statusName + ' ' + dateStr );

	} catch ( err ) {
		channel.send( 'I haven\t seen ' + name + ' ' + statusName );
	}

}

function hasStatus( gMember, statuses ) {

	let status = gMember.presence.status;
	if ( statuses instanceof Array ) {

		for( let i = statuses.length-1; i >= 0; i-- ) {	

			if ( statuses[i] === status ) return true;
		}
		return false;

	}
	return statuses === status;

}

// checks json history object for last time in a given status
// or in an array of statuses.
function latestStatus( history, statuses ) {

	if ( statuses instanceof Array ) {

		let status = null;
		let statusTime = null;
		
		if ( statuses.length == 0 ) { return null; }
		for( let i = statuses.length-1; i >= 0; i-- ) {

			status = statuses[i];
			if ( history.hasOwnProperty(status) ) {
				statusTime = ( statusTime==null ? history[status] : Math.max( history[status], statusTime ) );
			}

		}
		return statusTime;
	
	} else {
		if ( history.hasOwnProperty( statuses ) ) {
			return history[statuses];
		}
	}
	return null;
}

// send schedule message to channel, for user with displayName
async function sendSchedule( channel, displayName, activity ) {

	let gMember = tryGetUser( channel, displayName );
	if ( !gMember ) return;

	let sched = await readSchedule( gMember, activity );
	if ( sched ) {
		channel.send( displayName + ' ' + activity + ': ' + sched );
	} else {
		channel.send( 'No ' + activity + ' schedule found for ' +  displayName + '.' );
	}

}

// return members history object.
async function readHistory( gMember ){

	let data = await fetchMemberData( gMember );
	if ( data != null && data.hasOwnProperty('history')) return data.history;
	return null;

}

// guild member to find schedule for.
// type of schedule being checked.
// cb( scheduleString ) - string is null or empty on error
async function readSchedule( gMember, schedType ) {

	try {

		let data = await fetchMemberData( gMember );
		if ( data != null && data.hasOwnProperty('schedule') ) {
			return data.schedule[schedType];
		}
		return null;

	} catch ( err ){
		console.log( err );
		return null;
	}

}

/// sets the schedule of a given guild member, for a given schedule type.
async function setSchedule( gMember, scheduleType, scheduleString ) {

	try {

		let newData = { schedule: { [scheduleType]:scheduleString } };
		await mergeMember( gMember, newData );

	} catch ( err ) {
		console.log( 'could not set schedule.');
	}

}

function presenceChanged( oldMember, newMember ) {
	
	if ( oldMember.id == bot.id ) {
		// ignore bot events.
		return;
	}

	let oldStatus = oldMember.presence.status;
	let newStatus = newMember.presence.status;

	if ( newStatus != oldStatus ) {

		/// statuses: 'offline', 'online', 'idle', 'dnd'
		logHistory( oldMember, [oldStatus, newStatus] );
		console.log( newMember.displayName + ' status changed: ' + newStatus );

	}

	let oldGame = oldMember.presence.game;
	let newGame = newMember.presence.game;
	let oldGameName = oldGame ? oldGame.name : null;
	let newGameName = newGame ? newGame.name : null;

	if ( oldGameName != newGameName ){

		if ( oldGame != null ) {
			logGame( oldMember, oldGame );
		}
		if ( newGame != null ) {
			console.log( newMember.displayName + ' game changed: ' + newGame.name );
		}

	}

}

function logGame( guildMember, game ) {

	let gameName = game.name;
	let newData = { games:{
			[game.name]:Date.now()
		}
	};
	mergeMember( guildMember, newData );

}

// Log a guild member's last status within the guild.
function logHistory( guildMember, statuses ) {

	let now = Date.now();
	let history = {};
	for( var i = statuses.length-1; i >= 0; i-- ) {
		history[ statuses[i] ] = now;
	}

	mergeMember( guildMember, { history:history } );

}

function tryGetUser( channel, name ) {

	let member = findMember( channel, name );
	if ( member == null ) channel.send( 'User ' + name + ' not found.' );
	return member;

}

// hasMembers is an object with a members property,
// such as a Guild or a Channel.
function findMember( channel, name ) {

	if ( channel == null ) return null;

	switch ( channel.type ) {

		case 'text':
		case 'voice':

			let user = channel.guild.members.find( 'displayName', name );
			return user;

			break;
		case 'dm':
			return null;
			break;
		case 'group':
			return channel.nicks.find( val => val === name );
			break;

	}

}

// merge with existing member data.
async function mergeMember( guildMember, newData ){

	try {

		let data = await fetchMemberData( guildMember );
		jsutils.recurMerge( newData, data );
	
		newData = data;

	} catch ( err ){

		console.log( err );
		console.log( 'No data for ' + guildMember.displayName );

	} finally {

		try {
			await storeMemberData( guildMember, newData );
		} catch(err){}

	}

}

async function fetchMemberData( gMember ) {

	let memPath = fsys.memberPath( gMember );
	return await cache.get( memPath );

}

async function storeMemberData( gMember, data ) {

	let memPath = fsys.memberPath( gMember );
	await cache.store( memPath, data );

}