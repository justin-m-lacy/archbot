var Discord = require( 'discord.js');
var auth = require('./auth.json');

const DateFormat = require( './datedisplay.js' );
const dice = require( 'archdice' );
const jsutils = require( './jsutils.js' );
const cmd = require( './bot/command.js');
const DiscordBot = require( './bot/discordbot.js');

// init bot
var client = new Discord.Client(
	{ "messageCacheMaxSize":150,
	"messageCacheLifetime":100 } );

console.log( 'client created.');

try {
	var bot = DiscordBot.InitBot( client, auth.master );
	console.log( 'bot created.');
} catch (e ) {
	console.log(e);
}

initCmds();

client.on( 'presenceUpdate', presenceChanged );
client.on( 'error', doError );

console.log( 'logging in...');
client.login( auth.token );


function initCmds(){ 

	let cmds = bot.dispatch;

	console.log( 'adding default commands.');

	cmds.add( 'help', '!help <cmd>', cmdHelp, {maxArgs:1} );

	cmds.add( 'schedule', '!schedule <activity> <times>', cmdSchedule, { maxArgs:2, group:'right'} );

	cmds.add( 'sleep', '!sleep <sleep schedule>', cmdSleep, {maxArgs:1} );
	cmds.add( 'when', '!when <userName> <activity>', cmdWhen, {maxArgs:2} );
	cmds.add( 'roll','!roll [n]d[s]', cmdRoll, {maxArgs:1} );

	cmds.add( 'uid', '!uid <username>', cmdUid, {maxArgs:1}  );
	cmds.add( 'uname', '!uname <nickname>', cmdUName, {maxArgs:1} );
	cmds.add( 'nick', '!nick <displayName>', cmdNick, {maxArgs:1}  );
	cmds.add( 'uptime', '!uptime', cmdUptime );

	cmds.add( 'lastplay','!lastplay <userName> <gameName>', cmdLastPlay, {maxArgs:2} );
	cmds.add( 'laston', '!laston <userName>', cmdLastOn, {maxArgs:1} );
	cmds.add( 'lastidle', '!lastidle <userName>', cmdLastIdle, {maxArgs:1} );
	cmds.add( 'lastactive', '!lastactive <userName>', cmdLastActive, {maxArgs:1} );
	cmds.add( 'lastoff', '!lastoff <userName>', cmdLastOff, {maxArgs:1} );

	cmds.add( 'offtime', '!offtime <userName>', cmdOffTime, {maxArgs:1} );
	cmds.add( 'ontime', '!ontime <username>', cmdOnTime, {maxArgs:1} );
	cmds.add( 'idletime', '!idletime <username>', cmdIdleTime, {maxArgs:1} );
	cmds.add( 'playtime', '!playtime <userName>', cmdPlayTime, {maxArgs:1} );

	cmds.add( 'magicmissile', 'You need material components for all of your spells.',
		(m)=>m.channel.send( 'You attack the darkness.' ), {hidden:true} );
	cmds.add( 'palantir', 'What does the Great Eye command?', (m)=>m.channel.send( 'Build me an army worthy of Mordor.'), {hidden:true} );
	cmds.add( 'ranking', '!ranking', cmdRanking, { hidden:true, maxArgs:0});
	cmds.add( 'fuck', null, cmdFuck, {hidden:true} );

	cmds.add( 'test', '!test [ping message]', cmdTest, {maxArgs:1} );

}

function doError( err ) {
	console.log( 'Connection error: ' + err.message );
}

async function cmdRanking( m ) {
	return m.channel.send( 'Last place: garnish.');
}

async function cmdUptime( m ) {
	return m.channel.send( client.user.username + ' has reigned for ' + DateFormat.timespan( client.uptime ) );
}

async function cmdUName( msg, name ) {

	let gMember = bot.userOrShowErr( msg.channel, name );
	if ( !gMember ) return;
	return msg.channel.send( name + ' user name: ' + gMember.user.username )

}

async function cmdNick( msg, name ) {

	let gMember = bot.userOrShowErr( msg.channel, name );
	if ( !gMember ) return;
	return msg.channel.send( name + ' nickname: ' + gMember.nickname )

}

function cmdHelp( msg, cmd ) {

	if ( !cmd ) {
		bot.printCommands( msg.channel );
	} else {
		bot.printCommand( msg.channel, cmd);
	}

}

/**
 * 
 * @param {Message} msg 
 * @param {string} name 
 */
async function cmdUid( msg, name ) {

	let gMember = bot.userOrShowErr( msg.channel, name );
	if ( !gMember ) return;
	return msg.channel.send( name + ' uid: ' + gMember.user.id )

}

/**
 * 
 * @param {Discord.Message} msg 
 * @param {string} dicestr - roll formatted string.
 */
async function cmdRoll( msg, dicestr ) {

	let sender = bot.getSender( msg );

	let total = dice.parseRoll( dicestr );
	return msg.channel.send( bot.displayName(sender) + ' rolled ' + total );

}

function cmdSleep( msg, when ) {
	let sender = bot.getSender(msg);
	setSchedule( sender, 'sleep', when );
}

function cmdSchedule( msg, activity, when ) {

	let sender = bot.getSender(msg);
	setSchedule( sender, activity, when );
	return msg.channel.send( 'Scheduled ' + activity + ' for ' + bot.displayName(sender) );

}

function cmdWhen( msg, who, activity ) {
	return sendSchedule( msg.channel, who, activity );
}

function cmdLastPlay( msg, who, game ){
	return sendGameTime( msg.channel, who, game );
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
	if ( reply == null ) msg.channel.send( 'eh?' );
	else msg.channel.send( reply + ' yourself, ' + msg.member.displayName );
}
function cmdFuck( m ) {
	m.channel.send( m.content.slice(1) + ' yourself, ' + m.member.displayName );
}

async function sendGameTime( channel, displayName, gameName ) {
	
	let uObject = bot.userOrShowErr( channel, displayName );
	if ( !uObject ) return;

	if ( uObject.presence.game && uObject.presence.game.name === gameName ) {
		return channel.send( displayName + ' is playing ' + gameName );
	}

	try {

		let data = await bot.fetchUserData( uObject );
		let games = data.games;

		let dateStr = DateFormat.dateString( games[gameName] );
		return channel.send( displayName + ' last played ' + gameName + ' ' + dateStr );

	} catch ( err ) {
		console.log(err);
		await channel.send( gameName + ': No record for ' + displayName + ' found.' );
	}

}

async function cmdPlayTime( msg, name ){

	let chan = msg.channel;
	let gMember = bot.userOrShowErr( chan, name );
	if (!gMember) return;

	if ( !gMember.presence.game ) return chan.send( name + ' is not playing a game.');

	let gameName = gMember.presence.game.name;

	try {

		let data = await bot.fetchUserData( gMember );
		if ( data.hasOwnProperty('games') && data.games.hasOwnProperty( gameName )) {
			let lastTime = data.games[gameName];
			return chan.send( name + ' has been playing ' + gameName + ' for ' + DateFormat.elapsed(lastTime) );
		}

	} catch ( err ) {
		console.log(err);
	}
	return chan.send( 'I do not know when ' + name + '\'s game started.');

}

async function cmdIdleTime( msg, name ){

	let chan = msg.channel;
	let gMember = bot.userOrShowErr( chan, name );
	if ( !gMember ) return;

	if ( !hasStatus( gMember, 'idle')) return chan.send( name + ' is not idle.');

	try {

		let history = await readHistory(gMember);
		if ( history ) {

			let lastTime = latestStatus( history, ['offline','dnd','online'] );

			if ( lastTime ) return chan.send( name + ' has been idle for ' + DateFormat.elapsed( lastTime ) );

		}

	} catch ( err ){
		
		console.log( err );
	}

	return chan.send( 'I do not know when ' + name + ' went idle.' );

}

async function cmdOnTime( msg, name ) {

	let chan = msg.channel;

	let gMember = bot.userOrShowErr( chan, name );
	if ( !gMember ) return;

	if ( hasStatus(gMember, 'offline') ) return chan.send( name + ' is not online.' );

	try {

		console.log('reading history');
		let history = await readHistory(gMember);
		if ( history ) {

			let lastTime = latestStatus( history, 'offline' );

			if ( lastTime ) return chan.send( name + ' has been online for ' + DateFormat.elapsed( lastTime ) );

		}

	} catch ( err ){
		
		console.log( err );
	}

	return chan.send( 'I do not know when ' + name + ' came online.' );

}

async function cmdOffTime( msg, name ) {

	let chan = msg.channel;
	let gMember = bot.userOrShowErr( chan, name );
	if ( !gMember ) return;

	if ( !hasStatus(gMember, 'offline') ) return chan.send( name + ' is not offline.' );

	try {

		let history = await readHistory(gMember);
		if ( history ) {

			let lastTime = latestStatus( history, 'offline' );

			if ( lastTime ) return chan.send( name + ' has been offline for ' + DateFormat.elapsed( lastTime ) );

		}

	} catch ( err ){

		console.log( err );
	}
	return chan.send( 'I do not know when ' + name + ' went offline.' );

}

// send status history of user to channel.
// statuses is a single status string or array of valid statuses
// statusName is the status to display in channel.
async function sendHistory( channel, name, statuses, statusName ) {

	let gMember = bot.userOrShowErr( channel, name );
	if ( !gMember ) return;

	if ( !statusName ) statusName = statuses;

	if ( hasStatus(gMember, statuses ) ) return channel.send( name + ' is now ' + statusName + '.' );

	try {

		let memData = await bot.fetchUserData( gMember );
		let lastTime = latestStatus( memData.history, statuses );

		let dateStr = DateFormat.dateString( lastTime );
		
		return channel.send( 'Last saw ' + name + ' ' + statusName + ' ' + dateStr );

	} catch ( err ) {
		return channel.send( 'I haven\'t seen ' + name + ' ' + statusName + '.' );
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
		
		if ( statuses.length === 0 ) { return null; }
		for( let i = statuses.length-1; i >= 0; i-- ) {

			status = statuses[i];
			if ( history.hasOwnProperty(status) ) {
				statusTime = ( !statusTime ? history[status] : Math.max( history[status], statusTime ) );
			}

		}
		return statusTime;
	
	} else {

		if ( history.hasOwnProperty( statuses ) ) return history[statuses];

	}
	return null;
}

// send schedule message to channel, for user with displayName
async function sendSchedule( chan, name, activity ) {

	let gMember = bot.userOrShowErr( chan, name );
	if ( !gMember ) return;

	let sched = await readSchedule( gMember, activity );
	if ( sched ) return chan.send( name + ' ' + activity + ': ' + sched );

	return chan.send( 'No ' + activity + ' schedule found for ' +  name + '.' );

}


/**
 * Get the history object of a guild member.
 * @param {GuildMember} gMember
 * @returns {Object|null} 
 */
async function readHistory( gMember ){

	let data = await bot.fetchUserData( gMember );
	if ( data && data.hasOwnProperty('history')) return data.history;
	return null;

}

/**
 * 
 * @param {GuildMember} gMember - guild member to get schedule for.
 * @param {string} schedType 
 */
async function readSchedule( gMember, schedType ) {

	try {

		let data = await bot.fetchUserData( gMember );
		if ( data && data.hasOwnProperty('schedule') ) return data.schedule[schedType];

	} catch ( err ){
		console.log( err );
	}
	return null;

}

/**
 * Sets the schedule of a guild member, for a given schedule type.
 * @param {GuildMember|User} uObject - Discord user.
 * @param {string} scheduleType - type of activity to schedule.
 * @param {string} scheduleString - schedule description.
 */
async function setSchedule( uObject, scheduleType, scheduleString ) {

	return mergeMember( uObject, { schedule: { [scheduleType]:scheduleString } } );

}

function presenceChanged( oldMember, newMember ) {
	
	if ( oldMember.id === client.id ) {
		// ignore bot events.
		return;
	}

	let oldStatus = oldMember.presence.status;
	let newStatus = newMember.presence.status;

	/// statuses: 'offline', 'online', 'idle', 'dnd'
	if ( newStatus !== oldStatus ) logHistory( oldMember, [oldStatus, newStatus] );

	let oldGame = oldMember.presence.game;
	let newGame = newMember.presence.game;
	let oldGameName = oldGame ? oldGame.name : null;
	let newGameName = newGame ? newGame.name : null;

	if ( oldGameName !== newGameName ){

		logGames( oldMember, oldGame, newGame );

		/*if ( newGame ) {
			console.log( newMember.displayName + ' game changed: ' + newGame.name );
		}*/

	}

}

function logGames( guildMember, prevGame, curGame ) {

	let now = Date.now();
	var gameData = {};

	if ( prevGame ) gameData[prevGame.name] = now;
	if ( curGame ) gameData[curGame.name] = now;
	
	return mergeMember( guildMember, {games:gameData} );

}

// Log a guild member's last status within the guild.
function logHistory( guildMember, statuses ) {

	let now = Date.now();
	let history = {};
	for( var i = statuses.length-1; i >= 0; i-- ) {
		//console.log( 'logging status: ' + statuses[i]);
		history[ statuses[i] ] = now;
	}

	return mergeMember( guildMember, { history:history } );

}

/**
 * Merge existing user data.
 * @param {GuildMember|User} uObject 
 * @param {Object} newData - data to merge into existing data.
 */
async function mergeMember( uObject, newData ){

	let data = await bot.fetchUserData( uObject );
	if ( data ) {
		jsutils.recurMerge( newData, data );
		newData = data;
	}

	return bot.storeUserData( uObject, newData );

}