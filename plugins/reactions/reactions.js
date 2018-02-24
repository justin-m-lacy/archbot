var globalReactions;


class GuildReactions {

	constructor( context ) {

		this.reactions = {};

		this._context = context;
		this._context.onEvent( 'message', (m)=>{

			try {
				let resp = this.react(m.content);
				if ( resp != null ) m.channel.send( resp );
			} catch(e){
				conosle.log(e);
			}

		} );

		this.minWait = 5*60*1000;
		this.gWait = 3000;
		this.lastMsg = 0;

		this.loadReactions();

	}

	async cmdAddReaction( m, substr, react ) {

		if ( substr == null || react == null ) {
			m.channel.send( 'Usage: !react "string" "response"' );
			return;
		}

		await this.addReactData( substr, react );
		m.channel.send( 'Okie Dokie: ' + substr + " -> " + react );

	}

	async cmdRmReact( m, str ) {

		try {

			delete this.reactions[str];
			await this._context.storeKeyData( this._context.getDataKey( 'reactions', 'reactions'), this.reactions );

		} catch (e) { console.log(e);}

	}

	async addReactData( substr, react ) {

		try {
			this.reactions[ substr.toLowerCase() ] = { "r":react };
			await this._context.storeKeyData( this._context.getDataKey( 'reactions', 'reactions'), this.reactions );
		} catch ( e ) { console.log(e); }
	}

	async loadReactions() {

		try {
			let reactData = await this._context.fetchKeyData( this._context.getDataKey( 'reactions', 'reactions' ) );
			if ( reactData != null ) {

				var utils = require( '../../jsutils.js');
				//utils.recurMerge( this.reactions, reactData );
				this.reactions = reactData;

			}
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
				if ( resp != null ) return resp;

			}
		}

		for( let k in globalReactions ) {

			if ( lower.indexOf(k) >= 0 ) {

				resp = this.tryReact( globalReactions[k] );
				if ( resp != null ) return resp;

			}

		}

		return null;

	}

	tryReact( obj ) {

		let last = obj.last;
		if ( last != null && (this.lastMsg - last) < this.minWait ) return null;

		obj.last = this.lastMsg;
		return obj.r;

	}

}


exports.init = function( bot ) {

	console.log( 'loading Global reactions.');
	let reactData = require('./reactions.json');
	globalReactions = reactData;

	bot.addContextClass( GuildReactions );
	bot.addContextCmd( 'react', '!react <\"search trigger\"> <\"response string\">',
		GuildReactions.prototype.cmdAddReaction, GuildReactions, { minArgs:2, maxArgs:2} );
	bot.addContextCmd( 'rmreact', '!rmreact <\"react trigger\">', GuildReactions.prototype.cmdRmReact, GuildReactions,
		{ maxArgs:1 } );


}