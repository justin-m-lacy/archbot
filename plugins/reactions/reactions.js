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

	/**
	 * 
	 * @param {Message} m 
	 * @param {string} trig 
	 * @param {string} react 
	 */
	async cmdAddReaction( m, trig, react ) {

		if ( !trig || !react ) return m.channel.send( 'Usage: !react "string" "response"' );

		await this.addReactData( trig, react, m.author.id );

		return m.channel.send( 'Okie Dokie: ' + trig + " -> " + react );

	}

	/**
	 * 
	 * @param {Message} m 
	 * @param {string} trig 
	 * @param {string|null|undefined} which 
	 */
	async cmdRmReact( m, trig, which ) {

		if ( trig ) {

			let res = await this.rmReact( trig, which );
			if ( res === true ) return m.channel.send('Reaction removed.');
			else if ( res === false ) return m.channel.send('Reaction not found.');
			return m.channel.send( `${res} reactions found for trigger: ${trig}`);

		}

		return m.channel.send( 'Usage: !rmreact "string" ["reaction"]' );

	}

	/**
	 * Command to display information about a given Trigger/Reaction combination.
	 * @param {Message} m 
	 * @param {string} trig 
	 * @param {string|null|undefined} which 
	 */
	async cmdReactInfo( m, trig, which ) {

		let reacts = this.getReactions( trig, which );
		if ( !reacts ) return m.channel.send( 'No reaction found.');

		let resp = await this.infoString( reacts );

		return m.channel.send( resp );
	}

	/**
	 * Removes the given reaction string from the given reaction trigger. If no reaction
	 * string is specified, the reaction trigger will be removed if the given trigger
	 * has only a single reaction entry.
	 * @param {string} trig - The reaction trigger to remove a reaction from.
	 * @param {string|null|undefined} reaction - The reaction string to remove.
	 * @returns {bool|number} Returns true if a reaction is successfully removed.
	 * If no reaction string is specified, and multiple reactions are found,
	 * the number of reactions is returned.
	 * If no matching trigger/reaction pair is found, false is returned.
	 */
	async rmReact( trig, reaction ) {

		trig = trig.toLowerCase();
		let cur = this.reactions[trig];
		if ( !cur ) return false;

		if ( !reaction ) {

			// single reaction.
			if ( cur.r && (cur.r instanceof Array) && cur.r.length > 1 ) return cur.r.length;
			cur.r = null;

		} else if ( !this.tryRemove(cur,reaction) ) return false;

		if ( !cur.r ) delete this.reactions[trig];	// no reactions remaining.

		await this._context.storeKeyData( this._context.getDataKey( 'reactions', 'reactions'), this.reactions );

		return true;

	}

	/**
	 * 
	 * @param {Object} obj - reaction information object. 
	 * @param {string} which - reaction to match.
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

	/**
	 * Attempt to react to the given message content.
	 * @param {string} content 
	 */
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

	/**
	 * Return a string of information for the given reaction object.
	 * @param {string|object|Array} react 
	 */
	async infoString( react ) {

		if ( react === null || react === undefined ) return '';
		if ( typeof react === 'string' ) return react + ' ( Creator unknown )';

		var resp = '';

		if ( react instanceof Array ) {

			let len = react.length;
			for( let i = 0; i < len; i++ ) {
				resp += (i+1) + ') ' + ( await this.infoString( react[i]) + '\n\n' );
			}
			return resp;

		} else if ( react instanceof Object ) {

			resp = react.r;

			if ( react.uid ) {
	
				let name = await this._context.displayName( react.uid );
				resp += name ?  `\nCreated by ${name} (id:${react.uid})` : `\nCreated by user id: ${react.uid}`;

				if ( react.t ) resp += ` @ ${new Date(react.t)}`;

			}
			return resp;

		}

		return 'Unknown Reaction';

	}

	/**
	 * 
	 * @param {string} trig 
	 * @param {string|null} reactStr - the reaction string to return.
	 * @returns {string|object|Array|bool} False is returned if the given trigger/reaction string
	 * combination could not be found.
	 */
	getReactions( trig, reactStr=null ) {

		trig = trig.toLowerCase();
		let obj = this.reactions[trig] || globalReactions[trig];
		if ( !obj ) return false;

		// return all reactions.
		if ( !reactStr ) return obj.r;

		reactStr = reactStr.toLowerCase();
		let r = obj.r;
		if ( typeof r === 'string') {

			if ( reactStr === r.toLowerCase() ) return r;

		} else if ( r instanceof Array ) {

			return r.find( (elm)=>{
				if ( typeof elm === 'string') return elm.toLowerCase() === reactStr;
				else return ( typeof elm.r === 'string' && elm.r.toLowerCase() === reactStr );
			});

		} else if ( typeof r.r === 'string' && r.r.toLowerCase() === reactStr ) return r;

		return false;

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