const fsys = require( './botfs.js');
const cmd = require( './commands.js');
const cacher = require( './cache.js' );

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
		this._cache = new cacher.Cache( 250, fsys.readData, fsys.writeData )
		this._dispatch = new cmd.Dispatch( cmdPrefix );
		console.log( 'creating bot' );

	}

	async fetchMemberData( gMember ) {

		let memPath = fsys.memberPath( gMember );
		return await this._cache.get( memPath );
	
	}
	
	async storeMemberData( gMember, data ) {
	
		let memPath = fsys.memberPath( gMember );
		await this._cache.store( memPath, data );
	
	}

}