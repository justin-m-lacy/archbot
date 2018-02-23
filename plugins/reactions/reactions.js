var globalReactions;


class GuildReactions {

	constructor( context ) {

		this.reactions = {};

		this._context = context;
		this._context.onEvent( 'message', (m)=>{

			try {
				if ( m.author.id == m.client.user.id){
					return;
				}
				let resp = this.react(m.content);
				if ( resp != null ) m.channel.send( resp );
			} catch(e){conosle.log(e);
			}

		} );

		this.minWait = 0;
		this.gWait = 1;
		this.gTime = 0;

		console.log( "CREATING CONTEXT REACTIONS" );

		this.loadReactions();

	}

	async cmdAddReaction( m, substr, react ) {

		if ( substr == null || react == null ) {
			return;
		}
		await this.addReactData( substr, react );
		m.channel.send( 'Okie Dokie: ' + substr + " -> " + react );

	}

	async addReactData( substr, react ) {

		this.reactions[ substr.toLowerCase() ] = { "r":react };
		await this._context.storeKeyData( this._context.getDataKey( 'reactions', 'reactions'), this.reactions );

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

	react( message ) {

		//let now = Date.now()/1000;
		//if ( now - this.gTime < this.gWait ) return null;
		//this.gTime = now;

		let lower = message.toLowerCase();
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

		if ( obj.hasOwnProperty('last')){

			if ( this.gTime - obj.last < this.minWait ) return null;
		}
		obj.last = this.gTime;
		return obj.r;

	}

}


exports.init = function( bot ) {

	console.log( 'loading Global reactions.');
	let reactData = require('./reactions.json');
	globalReactions = reactData;

	bot.addContextClass( GuildReactions );
	bot.addContextCmd( 'react', '!react [\"search string\"] [\"response string\"]',
		GuildReactions.prototype.cmdAddReaction, GuildReactions, { minArgs:2, maxArgs:2} );

}