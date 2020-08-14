const Display = require( '../../display');

/**
 * @const {number} PROC_RATE - Base Proc chance to try any reaction.
 * In future, PROC_RATES might be defined per Context.
 */
const PROC_RATE = 0.25;

/**
 * @const {RegEx} regExTest - test if string defines a regex.
 */
const regExTest = /^\s*\/(.+)\/([gim]{0,3})\s*$/;

const Embeds = require( 'djs-embed');
const ReactSet = require( './reactset');

var globalReacts, globalRegEx;


/**
 * Handles reactions for a single DiscordContext.
 */
class GuildReactions {

	/**
	 * @property {BotContext}
	 */
	get context() { return this._context; }

	/**
	 * @constructor
	 * @param {BotContext} context
	 */
	constructor( context ) {

		this.allReacts = {};

		/**
		 * String->ReactSet
		 */
		this.reactions = new Map();

		/**
		 * RegEx->ReactSet - Reactions based on regular expressions.
		 * @property {Map<RegEx,ReactSet>}
		 */
		this.reMap = new Map();

		this._context = context;

		this._procPct = PROC_RATE;

		this.loadReactions();

		/**
		 * @property {number} minWait - minimum time in milliseconds between
		 * repeats of a single trigger.
		 */
		this.minWait = 1000;

		/**
		 * @property {number} gWait - global wait in milliseconds between
		 * any reactions at all (per Context.)
		 */
		this.gWait = 500;

		/**
		 * @property {number} msgTime - last time message was received in this context.
		 */
		this.msgTime = 0;

		this._context.onMsg( m=>{

			if ( Math.random() > this._procPct ) return;

			try {
				// global timeout wait.
				let now = Date.now();
				if ( now - this.gTime < this.gWait ) return;

				this.msgTime = now;

				let resp = this.react(m.content);
				if ( resp !== null ) {

					if ( resp instanceof Object ) {

						Embeds.replyEmbed( m, resp.r, resp.embed );

					} else return m.channel.send( resp );

				}

			} catch(e) { console.error(e); }

		} );

	}

	/**
	 * Command to add a reaction.
	 * @async
	 * @param {Message} m - User message.
	 * @param {string} trig - string or regex string to react to.
	 * @param {string} react - the reaction or reaction template to respond with.
	 * @returns {Promise}
	 */
	async cmdAddReact( m, trig, react ) {

		let embedUrl = Embeds.getSingle(m);
		if ( !trig || ( !react && !embedUrl ) ) return m.channel.send( 'Usage: !react "string" "response"' );

		let regex = toRegEx( trig );
		if ( regex !== false ) this.addRegEx( regex, react, m.author.id, embedUrl );
		else this.addString( trig, react, m.author.id, embedUrl );

		await this.storeReacts();

		if ( react ) return m.channel.send( 'Okie Dokie: ' + trig + " -> " + react );
		else return m.channel.send( 'Ahkay, reaction set.')

	}

	/**
	 * Command to remove a reaction.
	 * @async
	 * @param {Message} m
	 * @param {string} trig - reaction trigger.
	 * @param {string|null|undefined} which
	 * @returns {Promise}
	 */
	async cmdRmReact( m, trig, which ) {

		if ( trig ) {

			var res;

			if ( regExTest.test(trig) === true ) res = this.rmRegEx( trig, which );
			else res = this.rmString( trig, which );

			if ( res === true ) {

				await this.storeReacts();
				return m.channel.send('Reaction removed.');

			} else if ( res === false ) return m.channel.send('Reaction not found.');

			return m.channel.send( `${res} reactions found for trigger: ${trig}`);

		}

		return m.channel.send( 'Usage: !rmreact "string" ["reaction"]' );

	}

	/**
	 * Command to display information about a given Trigger/Reaction combination.
	 * @async
	 * @param {Message} m
	 * @param {string} trig - Reaction trigger.
	 * @param {string|null|undefined} [which=null] - The specific reaction for the given trigger
	 * to get information for.
	 * @returns {Promise}
	 */
	async cmdReactInfo( m, trig, which=null ) {

		let reacts = this.getReactions( trig, which );
		if ( !reacts ) return m.channel.send( 'No reaction found.');

		let resp = await this.infoString( reacts, true );

		return Display.sendPage( m, resp, 0 );

	}

	/**
	 * Command to display all information for a given reaction trigger.
	 * @async
	 * @param {Message} m
	 * @param {string} trig - Reaction trigger.
	 * @param {number} [page=1] - The page of text.
	 * @returns {Promise}
	 */
	async cmdReacts( m, trig, page=1 ) {

		/**
		 * Get list of all react trigger texts.
		 */
		if (!trig ) {

			// list of all triggers defined for server.
			let triggers = this.getTriggers();
			return;

		}

		let reacts = this.getReactions( trig );
		if ( !reacts ) return m.channel.send( 'No reaction found.');

		let resp = await this.infoString( reacts );

		let pageText = Display.pageString( resp );

		// get a single page of the response.
		resp = Display.getPageText( resp, page-1 );

		// append reaction count.
		if ( reacts instanceof Array ) resp += `\n\n${reacts.length} total reactions`;
		resp += '\n\n' + pageText;

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
	rmString( trig, reaction ) {

		trig = trig.toLowerCase();
		let rset = this.reactions.get( trig );

		if ( rset === undefined ) return false;

		let res = rset.tryRemove( reaction );
		if ( res === true && rset.isEmpty()) this.reactions.delete( trig );

		return res;

	}

	/**
	 *
	 * @param {string} trig - regex formatted string.
	 * @param {*} react
	 * @returns {boolean|number} - true on success.
	 */
	rmRegEx( trig, react ) {

		trig = toRegEx( trig );
		if ( trig === false ) return false;

		let pair = this.reMapPair( this.reMap, trig );

		if ( pair === undefined ) return false;

		let rset = pair[1];
		if ( !rset ) return false;

		let res = rset.tryRemove( react );
		if ( res === true && rset.isEmpty() ) this.reMap.delete( pair[0] );

		return res;

	}

	/**
	 * @async
	 * @returns {Promise}
	 */
	async storeReacts() {

		return this._context.storeData( this._context.getDataKey( 'reactions', 'reactions'), this.allReacts, true );

	}

	/**
	 * Regex reacts are by using a standard JS regular expression within quote marks "\^w+\" etc.
	 * Reactions may contain $n replacement groups where n is a 1-indexed group from the regular expression.
	 * @param {RegEx} regex - regular expression which triggers the reaction.
	 * @param {string} react
	 * @param {string} uid - discord id of creator.
	 * @param {string} [embedUrl=null] - url of linked attachment/embed.
	 */
	addRegEx( regex, react, uid, embedUrl=null ) {

		let rset = this.reMap.get( regex );

		if ( rset === undefined ) {
			rset = new ReactSet( regex );
			this.reMap.set( regex, rset );
		}
		rset.add( react, uid, embedUrl );

	}

	/**
	 *
	 * @param {string} trig - substring which triggers the reaction.
	 * @param {string} react
	 * @param {string} uid - discord id of reaction creator.
	 * @param {string} [embedUrl=null] - url of linked attachment/embed.
	 */
	addString( trig, react, uid, embedUrl=null ) {

		trig = trig.toLowerCase();
		let rset = this.reactions.get(trig);
		if ( rset === undefined ) {
			rset = new ReactSet( trig );
			this.reactions.set( trig, rset );
		}

		rset.add( react, uid, embedUrl );

	}

	/**
	 * Attempt to react to the given string message.
	 * @param {string} content - Message to react to.
	 * @returns {string|null} Reaction string for the message, or null
	 * if no match found.
	 */
	react( content ) {

		let resp = this.tryRegExs( this.reMap, content );
		if ( resp !== null ) return resp;

		resp = this.tryRegExs( globalRegEx, content );
		if ( resp !== null ) return resp;

		content = content.toLowerCase();
		resp = this.tryStrings( this.reactions, content );
		if ( resp !== null ) return resp;

		resp = this.tryStrings( globalReacts, content );
		return resp;

	}

	/**
	 *
	 * @param {Map<string,ReactSet>} map
	 * @param {string} str - input string to test.
	 * @returns {string|null} string reaction or null.
	 */
	tryStrings( map, str ) {

		for( let k of map.keys() ) {

			if ( str.indexOf(k) >= 0 ) {

				var rset = map.get(k);
				if ( rset === undefined ) {
					continue;
				}

				var last = rset.lastUsed;
				if ( last && (this.msgTime - last ) < this.minWait ) continue;
				rset.lastUsed = this.msgTime;

				return rset.getReact();

			}

		}
		return null;
	}

	/**
	 * Attempt to find a regular expression trigger match.
	 * @param {Map<RegEx,Reaction>} reMap - Map of regular expressions being tested.
	 * @param {string} str - string being tested.
	 * @returns {Object|Array|string|null}
	 */
	tryRegExs( map, str ) {

		for( let p of map.keys() ) {

			if ( p.test( str ) === true ) {

				var rset = map.get(p);
				if ( rset === undefined ) continue;

				var last = rset.lastUsed;
				if ( last && (this.msgTime - last ) < this.minWait ) continue;
				rset.lastUsed = this.msgTime;

				return p.global === true ? rset.textReplace(str) : rset.replaceReact( str );

			}

		} //
		return null;

	}

	/**
	 * Return a string of information for the given reaction object.
	 * @async
	 * @param {string|object|Array} react
	 * @param {boolean} [details=false] whether to include extended details about the reaction.
	 * @returns {Promise<string>}
	 */
	async infoString( react, details=false ) {

		if ( react === null || react === undefined ) return '';
		if ( typeof react === 'string' ) return react + ( details ? ' ( Creator unknown )' : '' );

		var resp = '';

		if ( react instanceof Array ) {

			let len = react.length;
			for( let i = 0; i < len; i++ ) {
				resp += '\n\n' + (i+1) + ') ' + ( await this.infoString( react[i], details ) );
			}
			return resp;

		} else if ( react instanceof Object ) {

			if ( react.r ) resp = react.r;

			if ( react.embed ) resp += '\nEmbedded URL: `' + react.embed + '`';


			if ( react.uid ) {

				let name = await this._context.displayName( react.uid );
				if ( name ) {

					resp += `\nCreated by ${name}`;
					if ( details ) resp += ` (id:${react.uid})`;

				} else resp += `\nCreated by user id: ${react.uid}`;

				if ( details && react.t ) resp += ` @ ${new Date(react.t)}`;

			}
			return resp;

		}

		return 'Unknown Reaction';

	}

	/**
	 * @returns {string[]} - array of all strings with reactions defined.
	 */
	getTriggers() {
	}

	/**
	 *
	 * @param {string|regEx} trig - trigger for the reaction.
	 * @param {string|null} [reactStr=null] - the reaction string to return, or null to return all reactions for
	 * the given trigger.
	 * @returns {string|object|Array|bool} Returns the single reaction found, or an array of reactions
	 * if no reactStr is specified.
	 * Returns false if no reactions match the trigger or trigger/reactStr combination.
	 */
	getReactions( trig, reactStr=null ) {

		if ( !trig ) return false;

		let regex = toRegEx( trig ), rset;
		if ( regex !== false ) rset = this.reMapFind( this.reMap, regex );
		else rset = this.reactions.get( trig.toLowerCase() );

		if ( rset === undefined ) return false;

		return rset.getReactions( reactStr );

	}

	/**
	 * Returns [key,value] array pair for regex->value stored in map.
	 * @param {*} map
	 * @param {*} regex
	 * @returns {Array|undefined}
	 */
	reMapPair( map, regex ) {

		let reStr = regex.toString();

		for( let a of map ) {
			if ( a[0].toString() === reStr ) return a;
		}
		return undefined;

	}

	/**
	 *
	 * @param {Map} map
	 * @param {string} reStr - regex string.
	 * @returns {ReactSet|undefined}
	 */
	reMapFind( map, regex ) {

		let reStr = regex.toString();

		for( let k of map.keys() ) {

			//console.log('testing: ' + k.toString() );

			if ( k.toString() === reStr ) return map.get( k );
		}
		return undefined;

	}

	/**
	 * @async
	 */
	async loadReactions() {

		try {

			console.log('loading guild reactions.');
			let reactData = await this._context.fetchData( this._context.getDataKey( 'reactions', 'reactions' ) );
			if ( !reactData ) return null;

			console.log('parsing reactions');
			this.allReacts = parseReacts( reactData );

			this.reactions = this.allReacts.strings;
			this.reMap = this.allReacts.regex;

			this._procPct = await this._context.getSetting( 'reactPct') || this._procPct;
		} catch ( e ) { console.error(e);}

	}

} //

/**
 *
 * @param {Object} reactData - reaction data.
 * @returns {Object}
 */
const parseReacts = ( reactData ) => {
	return {
		toJSON(){

			return {
				strings:mapToJSON( this.strings ),
				regex:mapToJSON( this.regex )
			}

		},
		strings:parseStrings( reactData.strings||reactData ), regex:parseRe(reactData.regex)
	};
}

/**
 *
 * @param {*} data
 * @returns {Map} - Reaction map.
 */
function parseStrings( data ) {

	let map = new Map();

	for( let p in data ) {
		map.set( p, new ReactSet(p, data[p] ) );
	}

	return map;

}

/**
 *
 * @param {Object|null} data
 * @returns {Map} - Reaction map.
 */
function parseRe( data ) {

	let map = new Map();

	if ( data ) {

		for( let p in data ) {

			if ( (p = toRegEx(p)) !== false ) map.set( p, new ReactSet(p, data[p] ) );

		}

	}

	return map;

}

/**
 *
 * @param {Map} map
 * @returns {Object}
 */
function mapToJSON( map ){

	let o = {};
	for( let [k,v] of map ) {
		o[ k ] = v;
	}
	return o;
}

/**
 * Tests if a string represents a valid regular expression.
 * If if does, the regular expression is returned.
 * If not, false is returned.
 * @param {string} s
 * @returns {RegExp|false}
 */
const toRegEx = ( s ) => {

	let res = regExTest.exec( s );
	if ( res === null ) return false;

	try {
		return new RegExp( res[1], res[2] );
	} catch (e) {}

	return false;
}

/**
 * Initialize the archbot plugin.
 * @param {DiscordBot} bot
 */
exports.init = function( bot ) {

	console.log( 'loading reactions.');

	let reactData = require('./reactions.json');
	reactData = parseReacts( reactData );

	globalReacts = reactData.strings;
	globalRegEx = reactData.regex;

	bot.addContextClass( GuildReactions );
	bot.addContextCmd( 'react', 'react <\"search trigger\"> <\"response string\">',
		GuildReactions.prototype.cmdAddReact, GuildReactions, { minArgs:2, maxArgs:2, group:'right'} );

	bot.addContextCmd( 'reactinfo', 'reactinfo <\"trigger"\"> [which]',
		GuildReactions.prototype.cmdReactInfo, GuildReactions, {minArgs:1, maxArgs:2, group:'right'} );
	bot.addContextCmd( 'reacts', 'reacts <\"trigger"\"> [page]',
		GuildReactions.prototype.cmdReacts, GuildReactions,
		{ minArgs:0, maxArgs:2, group:'left' });

	bot.addContextCmd( 'rmreact', 'rmreact <\"react trigger\"> [response]',
		GuildReactions.prototype.cmdRmReact, GuildReactions,
		{ minArgs:1, maxArgs:2, group:'right', access:2 } );

}