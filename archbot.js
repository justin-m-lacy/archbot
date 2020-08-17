var Discord = require( 'discord.js');
var auth = require('./auth.json');

const DateFormat = require( './datedisplay.js' );
const dice = require( 'archdice' );
const jsutils = require( './jsutils.js' );
const DiscordBot = require( './bot/discordbot.js');

// init bot
var client = new Discord.Client(
	{ "messageCacheMaxSize":150,
	"messageCacheLifetime":100 } );

console.log( 'client created.');

try {
	var bot = DiscordBot.InitBot( client, auth.owner, auth.admins );
	console.log( 'bot created.');
} catch (e ) {
	console.error(e);
}

initCmds();

client.on( 'presenceUpdate', presenceChanged );
client.on( 'error', err=>{
	console.error( 'Connection error: ' + err.message );
});

console.log( 'logging in...');
client.login( (process.env.NODE_ENV!=='production' && auth.dev) ? auth.dev.token || auth.token : auth.token );


function initCmds(){

	let cmds = bot.dispatch;

	cmds.add( 'help', 'help <cmd>', cmdHelp, {maxArgs:1, module:'default'} );

	cmds.add( 'schedule', 'schedule <activity> <times>', cmdSchedule, { maxArgs:2, group:'right', module:'default'} );

	cmds.add( 'sleep', 'sleep <sleep schedule>', cmdSleep, {maxArgs:1, module:'default'} );
	cmds.add( 'when', 'when <userName> <activity>', cmdWhen, {maxArgs:2, module:'default'} );
	cmds.add( 'roll','!roll [n]d[s]', cmdRoll, {maxArgs:1, module:'default'} );

	cmds.add( 'uid', 'uid <username>', cmdUid, {maxArgs:1, module:'default'}  );
	cmds.add( 'uname', 'uname <nickname>', cmdUName, {maxArgs:1, module:'default'} );
	cmds.add( 'nick', 'nick <displayName>', cmdNick, {maxArgs:1, module:'default'}  );
	cmds.add( 'uptime', 'uptime', cmdUptime );

	cmds.add( 'lastplay','!lastplay <userName> <gameName>', cmdLastPlay, {maxArgs:2, module:'default'} );
	cmds.add( 'laston', 'laston <userName>', cmdLastOn, {maxArgs:1, module:'default'} );
	cmds.add( 'lastidle', 'lastidle <userName>', cmdLastIdle, {maxArgs:1, module:'default'} );
	cmds.add( 'lastactive', 'lastactive <userName>', cmdLastActive, {maxArgs:1, module:'default'} );
	cmds.add( 'lastoff', 'lastoff <userName>', cmdLastOff, {maxArgs:1, module:'default'} );

	cmds.add( 'offtime', 'offtime <userName>', cmdOffTime, {maxArgs:1, module:'default'} );
	cmds.add( 'ontime', 'ontime <username>', cmdOnTime, {maxArgs:1, module:'default'} );
	cmds.add( 'idletime', 'idletime <username>', cmdIdleTime, {maxArgs:1, module:'default'} );
	cmds.add( 'playtime', 'playtime <userName>', cmdPlayTime, {maxArgs:1, module:'default'} );

	cmds.add( 'magicmissile', 'You need material components for all of your spells.',
		(m)=>m.channel.send( 'You attack the darkness.' ), {hidden:true, module:'magic'} );
	cmds.add( 'palantir', 'What does the Great Eye command?', (m)=>m.channel.send( 'Build me an army worthy of Mordor.'), {hidden:true, module:'orthanc'} );
	cmds.add( 'ranking', 'ranking', cmdRanking, { hidden:true, maxArgs:0});
	cmds.add( 'fuck', null, cmdFuck, {hidden:true, module:'explicit'} );

	cmds.add( 'test', 'test [ping message]', cmdTest, {maxArgs:1, module:'default'} );

}

async function cmdRanking( m ) { return m.channel.send( 'Last place: garnish.'); }

async function cmdUptime( m ) { return m.channel.send( client.user.username + ' has reigned for ' + DateFormat.timespan( client.uptime ) ); }

/**
 * @async
 * @param {Message} msg
 * @param {string} name
 * @returns {Promise}
 */
async function cmdUName( msg, name ) {

	let gMember = bot.userOrSendErr( msg.channel, name );
	if ( !gMember ) return;
	return msg.channel.send( name + ' user name: ' + gMember.user.username )

}

/**
 * @async
 * @param {Message} msg
 * @param {string} name
 * @returns {Promise}
 */
async function cmdNick( msg, name ) {

	let gMember = bot.userOrSendErr( msg.channel, name );
	if ( !gMember ) return;
	return msg.channel.send( name + ' nickname: ' + gMember.nickname )

}

/**
 *
 * @param {Message} msg
 * @param {string} [cmd] command to get help for.
 */
function cmdHelp( msg, cmd ) {

	if ( !cmd ) bot.printCommands( msg.channel );
	else bot.printCommand( msg.channel, cmd);

}

/**
 * @async
 * @param {Message} msg
 * @param {string} name
 * @returns {Promise}
 */
async function cmdUid( msg, name ) {

	let gMember = bot.userOrSendErr( msg.channel, name );
	if ( !gMember ) return;
	return msg.channel.send( name + ' uid: ' + gMember.user.id )

}

/**
 * @async
 * @param {Discord.Message} msg
 * @param {string} dicestr - roll formatted string.
 * @returns {Promise}
 */
async function cmdRoll( msg, dicestr ) {

	let sender = bot.getSender( msg );
	let total = dice.parseRoll( dicestr );
	return msg.channel.send( bot.displayName(sender) + ' rolled ' + total );

}

/**
 *
 * @param {Message} msg
 * @param {string} when
 */
function cmdSleep( msg, when ) {
	let sender = bot.getSender(msg);
	setSchedule( sender, 'sleep', when );
}

/**
 *
 * @param {Message} msg
 * @param {string} activity
 * @param {string} when
 */
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

/**
 *
 * @param {Message} msg
 * @param {string} who - user to check.
 */
function cmdLastOn( msg, who ){
	sendHistory( msg.channel, who, ['online','idle','dnd'], 'online' );
}

/**
 *
 * @param {Message} msg
 * @param {string} who - user to check.
 */
function cmdLastIdle( msg, who){
	sendHistory( msg.channel, who, 'idle');
}

/**
 *
 * @param {Message} msg
 * @param {string} who - user to check.
 */
function cmdLastActive( msg, who ){
	sendHistory( msg.channel, who, 'online', 'active' );
}

/**
 *
 * @param {Message} msg
 * @param {string} who - user to check.
 */
function cmdLastOff( msg, who ){
	sendHistory( msg.channel, who, 'offline' );
}

/**
 *
 * @param {Message} msg
 * @param {string} reply
 */
function cmdTest( msg, reply ){
	if ( reply == null ) msg.channel.send( 'eh?' );
	else msg.channel.send( reply + ' yourself, ' + msg.member.displayName );
}

function cmdFuck( m ) { m.channel.send( m.content.slice(1) + ' yourself, ' + m.member.displayName ); }

async function sendGameTime( channel, displayName, gameName ) {

	let uObject = bot.userOrSendErr( channel, displayName );
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
		console.error(err);
		return channel.send( gameName + ': No record for ' + displayName + ' found.' );
	}

}

/**
 *
 * @param {Message} msg
 * @param {string} name
 */
async function cmdPlayTime( msg, name ){

	let chan = msg.channel;
	let gMember = bot.userOrSendErr( chan, name );
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
		console.error(err);
	}
	return chan.send( 'I do not know when ' + name + '\'s game started.');

}

/**
 *
 * @param {Message} msg
 * @param {string} name
 */
async function cmdIdleTime( msg, name ){

	let chan = msg.channel;
	let gMember = bot.userOrSendErr( chan, name );
	if ( !gMember ) return;

	if ( !hasStatus( gMember, 'idle')) return chan.send( name + ' is not idle.');

	try {

		let history = await readHistory(gMember);
		if ( history ) {

			let lastTime = latestStatus( history, ['offline','dnd','online'] );

			if ( lastTime ) return chan.send( name + ' has been idle for ' + DateFormat.elapsed( lastTime ) );

		}

	} catch ( err ){

		console.error( err );
	}

	return chan.send( 'I do not know when ' + name + ' went idle.' );

}

/**
 *
 * @param {Message} msg
 * @param {string} name
 */
async function cmdOnTime( msg, name ) {

	let chan = msg.channel;

	let gMember = bot.userOrSendErr( chan, name );
	if ( !gMember ) return;

	if ( hasStatus(gMember, 'offline') ) return chan.send( name + ' is not online.' );

	try {

		let history = await readHistory(gMember);
		if ( history ) {

			let lastTime = latestStatus( history, 'offline' );

			if ( lastTime ) return chan.send( name + ' has been online for ' + DateFormat.elapsed( lastTime ) );

		}

	} catch ( err ){

		console.error( err );
	}

	return chan.send( 'I do not know when ' + name + ' came online.' );

}

/**
 * @async
 * @param {Message} msg
 * @param {string} name
 * @returns {Promise}
 */
async function cmdOffTime( msg, name ) {

	let chan = msg.channel;

	let gMember = bot.userOrSendErr( chan, name );
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

/**
 * Send status history of user to channel.
 * @async
 * @param {Channel} channel
 * @param {string} name - name of user to check.
 * @param {(string|string[])} statuses - status name or list of statuses to check.
 * @param {string} statusName - status to display.
 */
async function sendHistory( channel, name, statuses, statusName ) {

	let gMember = bot.userOrSendErr( channel, name );
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

/**
 *
 * @param {GuildMember} gMember
 * @param {string[]|string} statuses
 * @returns {boolean}
 */
function hasStatus( gMember, statuses ) {

	let status = gMember.presence.status;
	if ( Array.isArray( statuses ) ) {

		for( let i = statuses.length-1; i >= 0; i-- ) {

			if ( statuses[i] === status ) return true;
		}
		return false;

	}
	return statuses === status;

}

/**
 * checks history object for last time user was in a given status
 * or in any of the statuses given in an array.
 * @param {Object} history
 * @param {string|string[]} statuses
 */
function latestStatus( history, statuses ) {

	if ( !history ) return null;
	if ( Array.isArray( statuses ) ) {

		let status = null;
		let statusTime = null;

		if ( statuses.length === 0 ) { return null; }
		for( let i = statuses.length-1; i >= 0; i-- ) {

			status = statuses[i];
			if ( history.hasOwnProperty(status) === true ) {
				statusTime = ( !statusTime ? history[status] : Math.max( history[status], statusTime ) );
			}

		}
		return statusTime;

	} else if ( typeof statuses === 'string' ) {

		if ( history.hasOwnProperty( statuses ) === true ) return history[statuses];

	}
	return null;
}

/**
 * send schedule message to channel, for user with displayName
 * @async
 * @param {Channel} chan
 * @param {string} name
 * @param {string} activity
 * @returns {Promise}
 */
async function sendSchedule( chan, name, activity ) {

	let gMember = bot.userOrSendErr( chan, name );
	if ( !gMember ) return;

	let sched = await readSchedule( gMember, activity );
	if ( sched ) return chan.send( name + ' ' + activity + ': ' + sched );

	return chan.send( 'No ' + activity + ' schedule found for ' +  name + '.' );

}


/**
 * Get the history object of a guild member.
 * @async
 * @param {GuildMember} gMember
 * @returns {Promise<Object|null>}
 */
async function readHistory( gMember ){

	try {
		let data = await bot.fetchUserData( gMember );
		if ( data && data.hasOwnProperty('history')) return data.history;
	} catch(e) {
		console.log(e);
	}
	return null;

}

/**
 * @async
 * @param {GuildMember} gMember - guild member to get schedule for.
 * @param {string} schedType - activity to read schedule for.
 * @returns {Promise}
 */
async function readSchedule( gMember, schedType ) {

	try {

		let data = await bot.fetchUserData( gMember );
		if ( data && data.hasOwnProperty('schedule') ) return data.schedule[schedType];

	} catch ( err ){
		console.error( err );
	}
	return null;

}

/**
 * Sets the schedule of a guild member, for a given schedule type.
 * @async
 * @param {GuildMember|User} uObject - Discord user.
 * @param {string} scheduleType - type of activity to schedule.
 * @param {string} scheduleString - schedule description.
 * @returns {Promise}
 */
async function setSchedule( uObject, scheduleType, scheduleString ) {
	return mergeMember( uObject, { schedule: { [scheduleType]:scheduleString } } );
}

/**
 *
 * @param {GuildMember} oldMember
 * @param {GuildMember} newMember
 */
async function presenceChanged( oldMember, newMember ) {

	// ignore bot events.
	if ( oldMember.id === client.id ) return;

	let oldStatus = oldMember.presence.status;
	let newStatus = newMember.presence.status;

	/// statuses: 'offline', 'online', 'idle', 'dnd'
	if ( newStatus !== oldStatus ) await logHistory( oldMember, [oldStatus, newStatus] );

	let oldGame = oldMember.presence.game;
	let newGame = newMember.presence.game;
	let oldGameName = oldGame ? oldGame.name : null;
	let newGameName = newGame ? newGame.name : null;

	if ( oldGameName !== newGameName ) await logGames( oldMember, oldGame, newGame );

}

/**
 *
 * @param {GuildMember} guildMember
 * @param {Discord.Game} prevGame
 * @param {Discord.Game} curGame
 */
async function logGames( guildMember, prevGame, curGame ) {

	let now = Date.now();
	var gameData = {};

	if ( prevGame ) gameData[prevGame.name] = now;
	if ( curGame ) gameData[curGame.name] = now;

	return mergeMember( guildMember, {games:gameData} );

}

/**
 * Log a guild member's last status within the guild.
 * @param {GuildMember} guildMember
 * @param {string[]} statuses
 */
async function logHistory( guildMember, statuses ) {

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
 * @async
 * @param {GuildMember|User} uObject
 * @param {Object} newData - data to merge into existing data.
 * @returns {Promise}
 */
async function mergeMember( uObject, newData ){

	try {

		let data = await bot.fetchUserData( uObject );
		if ( typeof data === 'object' ) {
			jsutils.recurMerge( data, newData );
			newData = data;
		}

		return bot.storeUserData( uObject, newData );

	} catch(e) {
		console.error(e);
	}

}