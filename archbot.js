var Discord = require( 'discord.js');
var auth = require('./auth.json');

const dformat = require( './datedisplay.js' );
const dice = require( './plugins/dice/dice.js' );
const jsutils = require( './jsutils.js' );

const DiscordBot = require( './discordbot.js');

const PLUGINS_DIR = './plugins/';
const CmdPrefix = '!';

function initReactions() {

	console.log( 'loading reactions.');

	let React = require( './reactions.js');
	let reactData = require('./reactions.json');
	return new React.Reactions( reactData );
}

function initCmds(){ 

	let cmds = dispatch;

	console.log( 'adding default commands.');

	cmds.add( 'help', cmdHelp, 0, 1, '!help {cmd}' );
	cmds.add( 'schedule', cmdSchedule, 2, 2, '!schedule [activity] [times]', 'right');
	cmds.add( 'sleep', cmdSleep, 1, 1, '!sleep [sleep schedule]');
	cmds.add( 'when', cmdWhen, 2, 2, '!when [userName] [activity]');
	cmds.add( 'roll', cmdRoll, 1,1, '!roll [n]d[s]');

	cmds.add( 'uid', cmdUid, 1,1, '!uid [username]' );
	cmds.add( 'uname', cmdUName, 1,1, '!uname [nickname]' );
	cmds.add( 'nick', cmdNick, 1,1, '!nick [displayName]' );
	
	cmds.add( 'lastplay', cmdLastPlay, 2, 2, '!lastplay [userName] [gameName]');
	cmds.add( 'laston', cmdLastOn, 1, 1, '!laston [userName]');
	cmds.add( 'lastidle', cmdLastIdle, 1, 1, '!lastidle [userName]');
	cmds.add( 'lastactive', cmdLastActive, 1, 1, '!lastactive [userName]');
	cmds.add( 'lastoff', cmdLastOff, 1, 1, '!lastoff [userName]');

	cmds.add( 'offtime', cmdOffTime, 1,1, '!offtime [userName]');
	cmds.add( 'ontime', cmdOnTime, 1,1, '!ontime [username]');
	cmds.add( 'idletime', cmdIdleTime, 1,1, '!idletime [username]');
	cmds.add( 'playtime', cmdPlayTime, 1,1, '!playtime [userName');

	cmds.add( 'test', cmdTest, 1, 1, '!test [ping message]');

}


// init bot
var client = new Discord.Client( {} );
console.log( 'client created.');

var bot = new DiscordBot.Bot( client, CmdPrefix );
console.log( 'bot created.');

var reactions = initReactions();
var dispatch = bot.dispatch;
var cache = bot.cache;

initCmds();

function init_plug( p ) {

	if ( typeof( p.init ) == 'function' ) {
		console.log( 'initializing plugin');
		p.init( bot );
	} else {
		console.log( 'no init function found.');
	}

}
var plugins = require( './plugsupport.js' ).loadPlugins( PLUGINS_DIR, init_plug );

client.on( 'ready', function(evt) {
    console.log('client ready: ' + client.username + ' - (' + client.id + ')');
});

client.on( 'message', doMsg );
client.on( 'presenceUpdate', presenceChanged );
client.on( 'error', doError );

process.on( 'exit', onShutdown );
process.on( 'SIGINT', onShutdown );

console.log( 'logging in...');
client.login( auth.token );


function doError( err ) {
	console.log( 'Connection error: ' + err.message );
}

function onShutdown() {
	if ( client != null ) {
		client.destroy();
		client = null;
	}
}


function doMsg( msg ) {

	if ( msg.author.id == client.user.id ) return;

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

function cmdHelp( msg, cmd ) {

	if ( cmd == null ) {
		bot.printCommands( msg.channel );
	} else {
		bot.printCommand( msg.channel, cmd);
	}

}

function cmdUid( msg, name ) {

	let gMember = tryGetUser( msg.channel, name );
	if ( !gMember ) return;
	msg.channel.send( name + ' uid: ' + gMember.user.id )

}

function cmdRoll( msg, dicestr ) {

	let sender = bot.getSender( msg );
	if ( dicestr == null ) dicestr = '';

	let total = dice.parseRoll( dicestr );
	msg.channel.send( bot.displayName(sender) + ' rolled ' + total );

}

function cmdSleep( msg, when ) {
	let sender = bot.getSender(msg);
	setSchedule( sender, 'sleep', when );
}
function cmdSchedule( msg, activity, when ) {

	console.log( 'scheduling: ' + activity + ' at: ' + when );
	let sender = bot.getSender(msg);
	setSchedule( sender, activity, when );
	msg.channel.send( 'Scheduled ' + activity + ' for ' + bot.displayName(sender) );

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

function cmdLastIdle( msg, who){
	sendHistory( msg.channel, who, 'idle');
}
function cmdLastActive( msg, who ){
	sendHistory( msg.channel, who, 'online', 'active' );
}

function cmdLastOff( msg, who ){
	sendHistory( msg.channel, who, 'offline' );
}

function cmdTest( msg, reply ){
	msg.channel.send( reply + ' yourself, ' + msg.member.displayName );
}

async function sendGameTime( channel, displayName, gameName ) {
	
	let uObject = tryGetUser( channel, displayName );
	if ( !uObject ) return;

	if ( uObject.presence.game != null && uObject.presence.game.name === gameName ) {
		channel.send( displayName + ' is playing ' + gameName );
		return;
	}

	try {

		let data = await bot.fetchUserData( uObject );
		let games = data.games;

		let dateStr = dformat.DateDisplay.recent( games[gameName] );
		channel.send( displayName + ' last played ' + gameName + ' ' + dateStr );

	} catch ( err ) {
		console.log(err);
		channel.send( gameName + ': No record for ' + displayName + ' found.' );
	}

}

async function cmdPlayTime( msg, name ){

	let chan = msg.channel;
	let gMember = tryGetUser( chan, name );
	if (!gMember) return;

	if ( gMember.presence.game == null ) {
		chan.send( name + ' is not playing a game.');
		return;
	}

	let gameName = gMember.presence.game.name;
	console.log( "game: " + gameName );

	try {

		let data = await bot.fetchUserData( gMember );
		if ( data.hasOwnProperty('games') && data.games.hasOwnProperty( gameName )) {
			let lastTime = data.games[gameName];
			chan.send( name + ' has been playing ' + gameName + ' for ' + dformat.DateDisplay.elapsed(lastTime) );
			return;
		}

	} catch ( err ) {
		console.log(err);
	}
	chan.send( 'I do not know when ' + name + '\'s game started.');

}

async function cmdIdleTime( msg, name ){

	let chan = msg.channel;
	let gMember = tryGetUser( chan, name );
	if ( !gMember ) return;

	if ( !hasStatus( gMember, 'idle')){
		chan.send( name + ' is not currently idle.');
		return;
	}

	try {

		let history = await readHistory(gMember);
		if ( history != null ) {

			let lastTime = latestStatus( history, ['offline','dnd','online'] );

			if ( lastTime != null ){
				chan.send( name + ' has been idle for ' + dformat.DateDisplay.elapsed( lastTime ) );
				return;
			}

		}

	} catch ( err ){
		
		console.log( err );
	}

	chan.send( 'I do not know when ' + name + ' went idle.' );

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

	} catch ( err ){
		
		console.log( err );
	}

	chan.send( 'I do not know when ' + name + ' came online.' );

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

	} catch ( err ){

		console.log( err );
	}
	chan.send( 'I do not know when ' + name + ' went offline.' );

}

// send status history of user to channel.
// statuses is a single status string or array of valid statuses
// statusName is the status to display in channel.
async function sendHistory( channel, name, statuses, statusName ) {

	let gMember = tryGetUser( channel, name );
	if ( !gMember ) return;

	if ( statusName == null ) statusName = statuses;

	if ( hasStatus(gMember, statuses ) ) {

		channel.send( name + ' is now ' + statusName );
		return;

	}

	try {

		let memData = await bot.fetchUserData( gMember );
		let lastTime = latestStatus( memData.history, statuses );

		let dateStr = dformat.DateDisplay.recent( lastTime );
		
		channel.send( 'Last saw ' + name + ' ' + statusName + ' ' + dateStr );

	} catch ( err ) {
		channel.send( 'I haven\'t seen ' + name + ' ' + statusName );
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

	let data = await bot.fetchUserData( gMember );
	if ( data != null && data.hasOwnProperty('history')) return data.history;
	return null;

}

// guild member to find schedule for.
// type of schedule being checked.
// cb( scheduleString ) - string is null or empty on error
async function readSchedule( gMember, schedType ) {

	try {

		let data = await bot.fetchUserData( gMember );
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
async function setSchedule( uobject, scheduleType, scheduleString ) {

	try {

		let newData = { schedule: { [scheduleType]:scheduleString } };
		await mergeMember( uobject, newData );

	} catch ( err ) {
		console.log( 'could not set schedule.');
	}

}

function presenceChanged( oldMember, newMember ) {
	
	if ( oldMember.id == client.id ) {
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

		logGames( oldMember, oldGame, newGame );

		if ( newGame != null ) {
			console.log( newMember.displayName + ' game changed: ' + newGame.name );
		}

	}

}

function logGames( guildMember, prevGame, curGame ) {

	let now = Date.now();
	var gameData = {};

	if ( prevGame ) { gameData[prevGame.name] = now;
	}
	if ( curGame ){ gameData[curGame.name] = now;
	}
	
	mergeMember( guildMember, {games:gameData} );

}

// Log a guild member's last status within the guild.
function logHistory( guildMember, statuses ) {

	let now = Date.now();
	let history = {};
	for( var i = statuses.length-1; i >= 0; i-- ) {
		console.log( 'logging status: ' + statuses[i]);
		history[ statuses[i] ] = now;
	}

	mergeMember( guildMember, { history:history } );

}

function tryGetUser( channel, name ) {

	if ( name == null || name === '') {
		channel.send( 'User name expected.');
		return null;
	}
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

			let user = channel.guild.members.find(
				gm=> gm.displayName.toLowerCase() === name.toLowerCase()
			);
			return user;

			break;
		case 'dm':
			name = name.toLowerCase();
			if ( channel.recipient.username.toLowerCase() === name ) return channel.recipient;
			return null;
			break;
		case 'group':
			return channel.nicks.find( val => val.toLowerCase() === name.toLowerCase() );
			break;

	}

}

// merge existing data.
// uobject could be a GuildMember or a User.
async function mergeMember( uObject, newData ){

	try {

		let data = await bot.fetchUserData( uObject );
		if ( data != null ) {
			jsutils.recurMerge( newData, data );
			newData = data;
		}

	} catch ( err ){

		console.log( err );
		console.log( 'No data for ' + uObject.displayName );

	} finally {

		try {
			await bot.storeUserData( uObject, newData );
		} catch(err){}

	}

}