const fsys = require( './botfs.js');
const cmd = require( './commands.js');
const cacher = require( './cache.js' );
const Discord = require ( 'discord.js');

exports.Bot = class {

	get client() {
		return this._client;
	}
	get fsys() {
		return this._fsys;
	}
	get cache() {
		return this._cache;
	}
	get dispatch() {
		return this._dispatch;
	}

	constructor( client, cmdPrefix='!' ) {

		this._client = client;
		this._fsys = fsys;
		this._cache = new cacher.Cache( 250, fsys.readData, fsys.writeData );
		this._dispatch = new cmd.Dispatch( cmdPrefix );
		console.log( 'creating bot' );

	}

	displayName( uObject ){
		if ( uObject instanceof Discord.GuildMember ){
			return uObject.displayName;
		} else {
			return uObject.username;
		}

	}

	getSender( msg ) {

		if ( msg.member != null ) return msg.member;
		return msg.author;

	}

	printCommand( chan, cmdname ) {

		let cmds = this._dispatch.commands;
		if ( cmds != null && cmds.hasOwnProperty( cmdname ) ) {

			let cmdInfo = cmds[cmdname];
			let desc;
			if ( cmdInfo.hasOwnProperty( 'usage')) {
				desc = cmdname + ' usage: ' + cmdInfo.usage;
			} else {
				desc = 'No usage information found for: ' + cmdname;
			}
			chan.send( desc );

		} else {
			chan.send( 'Command not found.');
		}

	}

	printCommands( chan ) {

		let str = 'Use help [cmd] for more information.\nAvailable commands:\n';
		let cmds = this._dispatch.commands;
		if ( cmds != null ) {

			let a = [];
			for( let k in cmds ){
				a.push(k);
			}

			str += a.join(', ');

		}
		chan.send( str );

	}

	// fetch data for abitrary key.
	async fetchKeyData( key ) {

		let data = await this._cache.get(key);
		if ( data ) data.key = key;
		return data;

	}

	// associate data with key.
	async storeKeyData( key, data ){
		await this._cache.store( key, data );
	}

	// get a key to associate with the
	// given chain of data objects.
	getDataKey( baseObj, ...subs ) {

		if ( baseObj instanceof Discord.Channel ) {
			return fsys.channelPath( baseObj, subs );
		} else if ( baseObj instanceof Discord.GuildMember ){
			return fsys.guildPath( baseObj.guild, subs );
		} else if ( baseObj instanceof Discord.Guild ){
			return fsys.guildPath( baseObj, subs );
		}

	}

	async fetchUserData( uObject ){

		let objPath;
		if ( uObject instanceof Discord.GuildMember ){
			objPath = fsys.memberPath( uObject );
		} else {
			objPath = fsys.userPath( uObject );
		}
		let data = await this._cache.get( objPath );
		// save key for recaching.
		if ( data ) data.key = objPath;
		return data;
	}

	async storeUserData( uObject, data ){

		let objPath;
		if ( uObject instanceof Discord.GuildMember ){
			objPath = fsys.memberPath( uObject );
	
		} else {
			objPath = fsys.userPath( uObject );
		}
		await this._cache.store( objPath, data );

	}

	tryGetUser( channel, name ) {

		if ( name == null || name === '') {
			channel.send( 'User name expected.');
			return null;
		}
		let member = findMember( channel, name );
		if ( member == null ) channel.send( 'User ' + name + ' not found.' );
		return member;

	}

	findMember( channel, name ) {

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

}