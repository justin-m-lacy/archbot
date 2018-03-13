var Discord = require( 'discord.js');
var auth = require('./auth.json');

const DateFormat = require( './datedisplay.js' );
const dice = require( 'archdice' );
const jsutils = require( './jsutils.js' );
const cmd = require( './commands.js');
const DiscordBot = require( './discordbot.js');

const PLUGINS_DIR = './plugins/';
const CmdPrefix = '!';

// init bot
var client = new Discord.Client(
	{
	"messageCacheMaxSize":150,
	"messageCacheLifetime":100 } );

console.log( 'client created.');

var bot = DiscordBot.InitBot( client, auth.master, CmdPrefix );
console.log( 'bot created.');

initCmds();

var plugins = require( './plugsupport.js' ).loadPlugins( PLUGINS_DIR );
bot.addPlugins( plugins );

client.on( 'presenceUpdate', presenceChanged );
client.on( 'error', doError );

process.on( 'exit', onShutdown );
process.on( 'SIGINT', onShutdown );

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

function onShutdown() {
	if ( client != null ) {
		client.destroy();
		client = null;
	}
	process.exit(1);
}


function cmdRanking( m ) {
	m.channel.send( 'Last place: garnish.');
}

function cmdUptime( m ) {
	m.channel.send( client.user.username + ' has reigned for ' + DateFormat.timespan( client.uptime ) );
}

function cmdUName( msg, name ) {

	let gMember = bot.userOrShowErr( msg.channel, name );
	if ( !gMember ) return;
	msg.channel.send( name + ' user name: ' + gMember.user.username )

}

function cmdNick( msg, name ) {

	let gMember = bot.userOrShowErr( msg.channel, name );
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

	let gMember = bot.userOrShowErr( msg.channel, name );
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
	if ( reply == null ) msg.channel.send( 'eh?' );
	else msg.channel.send( reply + ' yourself, ' + msg.member.displayName );
}
function cmdFuck( m ) {
	m.channel.send( m.content.slice(1) + ' yourself, ' + m.member.displayName );
}

async function sendGameTime( channel, displayName, gameName ) {
	
	let uObject = bot.userOrShowErr( channel, displayName );
	if ( !uObject ) return;

	if ( uObject.presence.game != null && uObject.presence.game.name === gameName ) {
		await channel.send( displayName + ' is playing ' + gameName );
		return;
	}

	try {

		let data = await bot.fetchUserData( uObject );
		let games = data.games;

		let dateStr = DateFormat.dateString( games[gameName] );
		await channel.send( displayName + ' last played ' + gameName + ' ' + dateStr );

	} catch ( err ) {
		console.log(err);
		await channel.send( gameName + ': No record for ' + displayName + ' found.' );
	}

}

async function cmdPlayTime( msg, name ){

	let chan = msg.channel;
	let gMember = bot.userOrShowErr( chan, name );
	if (!gMember) return;

	if ( gMember.presence.game == null ) {
		await chan.send( name + ' is not playing a game.');
		return;
	}

	let gameName = gMember.presence.game.name;
	console.log( "game: " + gameName );

	try {

		let data = await bot.fetchUserData( gMember );
		if ( data.hasOwnProperty('games') && data.games.hasOwnProperty( gameName )) {
			let lastTime = data.games[gameName];
			await chan.send( name + ' has been playing ' + gameName + ' for ' + DateFormat.elapsed(lastTime) );
			return;
		}

	} catch ( err ) {
		console.log(err);
	}
	await chan.send( 'I do not know when ' + name + '\'s game started.');

}

async function cmdIdleTime( msg, name ){

	let chan = msg.channel;
	let gMember = bot.userOrShowErr( chan, name );
	if ( !gMember ) return;

	if ( !hasStatus( gMember, 'idle')){
		await chan.send( name + ' is not currently idle.');
		return;
	}

	try {

		let history = await readHistory(gMember);
		if ( history != null ) {

			let lastTime = latestStatus( history, ['offline','dnd','online'] );

			if ( lastTime != null ){
				await chan.send( name + ' has been idle for ' + DateFormat.elapsed( lastTime ) );
				return;
			}

		}

	} catch ( err ){
		
		console.log( err );
	}

	await chan.send( 'I do not know when ' + name + ' went idle.' );

}

async function cmdOnTime( msg, name ) {

	let chan = msg.channel;

	let gMember = bot.userOrShowErr( chan, name );
	if ( !gMember ) return;

	if ( hasStatus(gMember, 'offline') ) {
		return await chan.send( name + ' is not online.' );
	}

	try {

		console.log('reading history');
		let history = await readHistory(gMember);
		if ( history != null ) {

			let lastTime = latestStatus( history, 'offline' );

			if ( lastTime != null ){
				await chan.send( name + ' has been online for ' + DateFormat.elapsed( lastTime ) );
				return;
			}

		}

	} catch ( err ){
		
		console.log( err );
	}

	await chan.send( 'I do not know when ' + name + ' came online.' );

}

async function cmdOffTime( msg, name ) {

	let chan = msg.channel;
	let gMember = bot.userOrShowErr( chan, name );
	if ( !gMember ) return;

	if ( !hasStatus(gMember, 'offline') ) {
		await chan.send( name + ' is not offline.' );
		return;
	}

	try {

		let history = await readHistory(gMember);
		if ( history != null ) {

			let lastTime = latestStatus( history, 'offline' );

			if ( lastTime != null ){
				await chan.send( name + ' has been offline for ' + DateFormat.elapsed( lastTime ) );
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

	let gMember = bot.userOrShowErr( channel, name );
	if ( !gMember ) return;

	if ( statusName == null ) statusName = statuses;

	if ( hasStatus(gMember, statuses ) ) {

		channel.send( name + ' is now ' + statusName + '.' );
		return;

	}

	try {

		let memData = await bot.fetchUserData( gMember );
		let lastTime = latestStatus( memData.history, statuses );

		let dateStr = DateFormat.dateString( lastTime );
		
		channel.send( 'Last saw ' + name + ' ' + statusName + ' ' + dateStr );

	} catch ( err ) {
		channel.send( 'I haven\'t seen ' + name + ' ' + statusName + '.' );
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
async function sendSchedule( channel, name, activity ) {

	let gMember = bot.userOrShowErr( channel, name );
	if ( !gMember ) return;

	let sched = await readSchedule( gMember, activity );
	if ( sched ) {
		await channel.send( name + ' ' + activity + ': ' + sched );
	} else {
		await channel.send( 'No ' + activity + ' schedule found for ' +  name + '.' );
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
		//console.log( newMember.displayName + ' status changed: ' + newStatus );

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
		//console.log( 'logging status: ' + statuses[i]);
		history[ statuses[i] ] = now;
	}

	mergeMember( guildMember, { history:history } );

}

// merge existing data.
// uobject could be a GuildMember or a User.
async function mergeMember( uObject, newData ){

	let data = await bot.fetchUserData( uObject );
	if ( data != null ) {
		jsutils.recurMerge( newData, data );
		newData = data;
	}

	await bot.storeUserData( uObject, newData );

}