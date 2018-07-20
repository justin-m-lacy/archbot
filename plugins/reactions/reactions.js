var globalReactions;

/**
 * Class which handles reactions for a single guild.
 * Instantiated for each Discord Context.
 */
class GuildReactions {

	constructor( context ) {

		this.reactions = {};

		this._context = context;
		this._context.onMsg( (m)=>{

			try {
				let resp = this.react(m.content);
				if ( resp != null ) m.channel.send( resp );
			} catch(e){
				console.log(e);
			}

		} );

		this.minWait = 0*5*60*1000;
		this.gWait = 3000;
		this.lastMsg = 0;

		this.loadReactions();

	}

	async cmdAddReaction( m, trig, react ) {

		if ( trig == null || react == null ) {
			m.channel.send( 'Usage: !react "string" "response"' );
			return;
		}

		await this.addReactData( trig, react, m.author.id );
		m.channel.send( 'Okie Dokie: ' + trig + " -> " + react );

	}

	async cmdRmReact( m, trig, which ) {

		if ( !trig || !which ) return m.channel.send( 'Usage: !rmreact "string" ["reaction"]' );

		let res = await this.rmReact( trig, which );
		if ( res ) return m.channel.send('Reaction removed.');

		return m.channel.send('Reaction not found.');

	}

	async cmdReactInfo( m, trig, which ) {

		let info = this.reactInfo( trig, which );
		if ( !info ) return m.channel.send( 'No reaction found.');
		if ( typeof info === 'string') return m.channel.send( 'No information about this reaction.');
		if ( info instanceof Array ) return m.channel.send( `Multiple reactions found for trigger ${trig}.`);

		if ( info.uid ) {
			let name = await this._context.displayName( info.uid );
			let resp = name ?  `Reaction created by ${name} (id:${info.uid})` : `Reaction created by user id: ${info.uid}`;

			if ( info.t ) resp += ` @ ${new Date(info.t)}`;
			return m.channel.send( resp );
		}

		return m.channel.send( 'No information about this reaction.');
	}

	async rmReact( trig, which ) {

		trig = trig.toLowerCase();
		let cur = this.reactions[trig];
		if ( !cur ) return false;

		if ( !which ) delete this.reactions[trig];
		else {

			if ( !this.tryRemove(cur,which) ) return false;
			if ( !cur.r ) delete this.reactions[trig];

		}

		await this._context.storeKeyData( this._context.getDataKey( 'reactions', 'reactions'), this.reactions );

		return true;

	}

	/**
	 * 
	 * @param {Object} obj - reaction information object. 
	 * @param {*} which - string reaction to match.
	 */
	tryRemove( obj, which ) {

		let r = obj.r;

		which = which.toLowerCase();

		if ( typeof r === 'string') {

			if ( r.toLowerCase() === which ) {
				obj.r = null;
				return true;
			}

		} else if ( r instanceof Array ) {

			let ind = r.findIndex( (elm)=>{
				if ( typeof elm === 'string' ) return elm.toLowerCase() === which;
				return ( typeof elm.r === 'string') && elm.r.toLowerCase() === which;
			});

			if ( ind >= 0 ) {
				r.splice( ind, 1 );
				return true;
			}

		} else if ( typeof r.r === 'string' && r.r.toLowerCase() === which ) {
			obj.r = null;
			return true;
		}

		return false;
	}

	async addReactData( trig, react, uid ) {

		try {

			trig = trig.toLowerCase();
			let cur = this.reactions[ trig ];

			react = { r:react, uid:uid, t:Date.now() };

			if ( cur ) {

				// merge with existing react.
				let r = cur.r;
				if ( (r instanceof Array )) {
					r.push( react );
				} else {
					cur.r = [ r, react ];
				}

			} else {

				this.reactions[ trig ] = { "r":react };
			}

			await this._context.storeKeyData(
				this._context.getDataKey( 'reactions', 'reactions'), this.reactions );
	
		} catch ( e ) { console.log(e); }
	}

	async loadReactions() {

		try {
			let reactData = await this._context.fetchKeyData( this._context.getDataKey( 'reactions', 'reactions' ) );
			if ( reactData != null ) this.reactions = reactData;
		} catch ( e ) { console.log(e);}

	}

	react( content ) {

		let now = Date.now();
		if ( now - this.gTime < this.gWait ) return null;
		this.lastMsg = now;

		let lower = content.toLowerCase();
		let resp;

		for( let k in this.reactions ) {

			if ( lower.indexOf(k) >= 0 ) {

				resp = this.tryReact( this.reactions[k] );
				if ( resp ) return resp;

			}
		}

		for( let k in globalReactions ) {

			if ( lower.indexOf(k) >= 0 ) {

				resp = this.tryReact( globalReactions[k] );
				if ( resp ) return resp;

			}

		}

		return null;

	}

	tryReact( obj ) {

		if ( !(obj instanceof Object) ) return;

		let last = obj.last;
		if ( last && (this.lastMsg - last) < this.minWait ) return null;
		obj.last = this.lastMsg;

		let r = obj.r;
		if ( r instanceof Array ) {
			r = r[ Math.floor( r.length*Math.random() )];
		}
		if ( typeof r === 'string') return r;
		return r.r;

	}

	reactInfo( trig, which ) {

		trig = trig.toLowerCase();
		let obj = this.reactions[trig] || globalReactions[trig];
		if ( !obj ) return;
		if ( !which ) return obj.r;

		which = which.toLowerCase();
		let r = obj.r;
		if ( typeof r === 'string') {

			if ( which === r.toLowerCase() ) return r;

		} else if ( r instanceof Array ) {

			return r.find( (elm)=>{
				if ( typeof elm === 'string') return elm.toLowerCase() === which;
				else return ( typeof elm.r === 'string' && elm.r.toLowerCase() === which );
			});

		} else if ( typeof r.r === 'string' && r.r.toLowerCase() === which ) return r;


	}

}

/**
 * Initialize the archbot plugin.
 * @param {DiscordBot} bot 
 */
exports.init = function( bot ) {

	console.log( 'loading Global reactions.');
	let reactData = require('./reactions.json');
	globalReactions = reactData;

	bot.addContextClass( GuildReactions );
	bot.addContextCmd( 'react', '!react <\"search trigger\"> <\"response string\">',
		GuildReactions.prototype.cmdAddReaction, GuildReactions, { minArgs:2, maxArgs:2, group:'right'} );
	bot.addContextCmd( 'reactinfo', '!reactinfo <\"trigger"\"> [response]',
		GuildReactions.prototype.cmdReactInfo, GuildReactions, { minArgs:1, maxArgs:2, group:'right'});

	bot.addContextCmd( 'rmreact', '!rmreact <\"react trigger\"> [response]', GuildReactions.prototype.cmdRmReact, GuildReactions,
		{ minArgs:1, maxArgs:2, group:'right' } );


}