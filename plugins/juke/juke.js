const Discord = require( 'discord.js' );
const AudioSource = require( './audioSource' );

const path = require( 'path' );

/**
 * @constant {number} MAX_STREAMS - Maximum number of simultaneous audio streams.
 * Currently Unused.
 */
const MAX_STREAMS = 3;

/**
 * @constant {string} CHANNEL_SETTING - setting for audio channel.
 */
const CHANNEL_SETTING = 'jukechannel';

class Juke {

	/**
	 * @property {VoiceConnection} connection - The current voice-connection, if any.
	 */
	get connection() { return this._connection; }

	/**
	 * @property {VoiceChannel} channel - current voice channel, if any.
	 */
	get channel() { return this._channel; }

	/**
	 * @property {string} channelName - name of voice-channel to join.
	 */
	get channelName() { return this._channelName; }

	/**
	 * @property {AudioSource[]} queue - queue of files to play.
	 */
	get queue() { return this._queue; }

	/**
	 * @property {boolean} playing - whether music is playing.
	 */
	get playing() { return this._playing; }

	/**
	 * 
	 * @param {BotContext} context 
	 */
	constructor( context ) {

		this._context = context;

		this.savedir = this._context.botfs.getPluginDir( 'juke' );

		/**
		 * @member {AudioSource[]} _queue - files queued for play.
		 */
		this._queue = [];

		/**
		 * @member {AudioSource[]} _allFiles - list of available play files.
		 */
		this._allSongs = [];

		this._channel = null;
		this._channelName = null;
		context.getSetting( CHANNEL_SETTING, '' ).then(
			res=>{
				if ( res ) {
					this._channelName = this._channelName || res;	//race cond.
					this.tryJoinChannel();
				}
			}
		);

		context.bot.client.on( 'voiceStateUpdate', (o,n)=>this.voiceChanged(o,n) );

		this.readFileSongs();
	}

	readFileSongs() {

		const afs = this._context.afs;
		afs.readfiles( this.savedir ).then(

			files=>{

				for( let name of files ) {
					this._allSongs.push( new AudioSource( name ) );
				}

			},
			err=>{
				console.error('Could not read song files: ' + err );
			}

		);

	}

	addFileSources( files ) {
	}

	playNext() {

		if ( !this.channel || !this._connection || this.channel.members.size <= 1
			|| this._queue.length <= 0 ) return;

		let next = this._queue.shift();

		var dispatcher;
		if ( next.type === 'web') dispatcher = this._connection.playArbitraryInput( next.path );
		else dispatcher = this._connection.playFile( path.normalize( this.savedir + '/' + next.path ) );

		dispatcher.on( 'error', ()=>{
			console.error('STREAM ERROR');
			this.playNext();
		});

		dispatcher.on( 'end', ()=>{
			console.log('play ended');
			this.playNext();
		});

	}

	/**
	 * Attempt to join the current voice channel.
	 */
	tryJoinChannel() {

		let channel = this._context.findChannel( this._channelName );
		if ( !channel ) {
			console.error('Channel not found: ' + channel );
			return false;
		}

		if ( !(channel instanceof Discord.VoiceChannel )) return false;

		channel.join().then( vc=>{

			console.log('voice channel joined.');
			this._channel = channel;
			this._connection = vc;

			this.playNext();

		}, err=>{
			console.error('Join Channel Failed: ' + err );
		});

	}

	/**
	 * User voice state changed. Check that there is a still a listener
	 * in the juke's voice channel.
	 * @param {GuildMember} oldMember 
	 * @param {GuildMember} newMember 
	 */
	voiceChanged( oldMember, newMember ) {

		if ( !this.channel || !this.channel.connection ) return;
		if ( !( oldMember.voiceChannel == this.channel || newMember.voiceChannel == this.channel ) ) return;

		console.log('VOICE STATUS CHANGED');

		if ( this._connection.speaking ) {

			if ( this._connection.dispatcher && this.channel.members.size <= 1 ) {
				this._connection.dispatcher.pause();
			}

		} else {

			if ( this.channel.members.size > 1 ) {
				if ( this._connection.dispatcher ) dispatcher.resume();
				else this.playNext();
			}
		}

	}

		/**
	 * Get or set the play channel.
	 * @param {Message} m 
	 * @param {string} [channel=null]
	 */
	async cmdChannel( m, channel=null ) {

		if ( !channel ) {

			if ( this._channelName ) return m.reply( 'Current Juke Channel: ' + this._channelName );
			else return m.reply( 'There is no juke channel for this server.');

		} else {

			this._channelName = channel;
			this.tryJoinChannel();

		}

	}

	/**
	 * Resolve a song title or song number into a music source.
	 * @param {string|number} which
	 * @returns {}
	 */
	resolveSong( which ) {

		if ( isNaN(which) ) {

			which = which.toLowerCase();
			return this._allSongs.find( v=>{
				v.title.toLowerCase() === which || v.path.toLowerCase() === which;
			});

		} else {

			let num = Number( which ) - 1;	// 1->0 index.
			if ( num < 0 || num >= this._allSongs.length ) {
				return null;
			}
			return this._allSongs[num];

		}

	}

	/**
	 * Check if a song path already exists in the song list.
	 * @param {string} songPath
	 * @returns {boolean}
	 */
	songExists( songPath ) {

		songPath = songPath.toLowerCase();
		return this._allSongs.find( v=>{
			v.path === songPath;
		}) != null;
	}

	async cmdAdd( m, uri, title=null ) {

		if ( this.songExists(uri) ) return m.reply( 'Song already listed in database.' );

		let src = new AudioSource( uri, title );
		this._allSongs.push( src );

		return m.reply( 'Song added: ' + (title || uri) );

	}

	async cmdQueue( m, which, title=null ) {

		let src = this.resolveSong( which );
		if ( !src ) src = new AudioSource( which, title );

		this._queue.push( src );

		if ( this._connection && !this._connection.speaking ) this.playNext();

		return m.reply( 'Queued song ' + (title || which ) );
	}

	async cmdRemove( m, which, title=null ) {
	}

	async cmdSongs( m ) {
		return m.channel.send( 'Songs Available:\n' + this.displayList( this._allSongs ) );
	}

	async cmdPlaylist( m ) {
		return m.channel.send( 'Current Playlist:\n' + this.displayList( this._queue ) );
	}

	/**
	 * Return a song-list string.
	 * @param {AudioSource[]} list
	 * @returns {string}
	 */
	displayList( list ) {
		return list.map( (v,ind)=> (ind+1) + ') ' + v.toString() ).join('\n');
	}

}


exports.init = function( bot ) {

	bot.addContextCmd( 'jukechannel', 'jukechannel [channel]',
		Juke.prototype.cmdChannel, Juke, { minArgs:0, maxArgs:1, group:'right'} );
	bot.addContextCmd( 'jukeadd', 'jukeadd <song URI> [song title]',
		Juke.prototype.cmdAdd, Juke, { minArgs:1, maxArgs:2, group:'right'} );
	bot.addContextCmd( 'jukerm', 'jukerm <song #|song title|song URI>',
		Juke.prototype.cmdRemove, Juke, { minArgs:1, maxArgs:1, group:'right'} );
	bot.addContextCmd( 'jukeq', 'jukeq <song #|song title|song URI> [song title]',
		Juke.prototype.cmdQueue, Juke, { minArgs:1, maxArgs:2, group:'left'} );

	bot.addContextCmd( 'playlist', 'playlist',
		Juke.prototype.cmdPlaylist, Juke );
	bot.addContextCmd( 'songs', 'songs',
		Juke.prototype.cmdSongs, Juke );

}