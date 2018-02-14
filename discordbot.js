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

}