const Display = require( '../../display');



/**
 * @const {number} PROC_RATE - Base Proc chance to try any reaction.
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

		/**
		 * @property {object} allReacts
		 * @property {Map<string,ReactSet>} allReacts.strings
		 * @property {Map<RegEx,ReactSet>} allReacts.regex
		 */
		this.allReacts = {};

		/**
		 * @property {Map<string,ReactSet} reactions
		 */
		this.reactions = new Map();

		/**
		 * @property {Map<string,ReactSet>} reMap - Reactions with Regular Expression triggers.
		 * Map key is the string version of the RegEx object.
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

		// begin listening for messages to react to.
		this.listen();

	}

	listen(){

		this._context.onMsg( m=>{

			if ( Math.random() > this._procPct ) return;

			// global timeout wait.
			let now = Date.now();
			if ( now - this.gTime < this.gWait ) return;

			try {

				this.msgTime = now;

				let rset = this.findSet(m.content);
				if ( rset !== null ) {

					return this.respond( m, rset );

				}

			} catch(e) { console.error(e); }

		} );

	}

	/**
	 * Respond with a reaction from the given ReactSet
	 * @param {Message} m
	 * @param {ReactSet} rset
	 * @returns {Promise}
	 */
	async respond( m, rset ) {

		var last = rset.lastUsed;
		if ( last && (this.msgTime - last ) < this.minWait ) continue;
		rset.lastUsed = this.msgTime;

		// get random reaction from set.
		let react = rset.getReact();

		let resp = react.getResponse( rset.trigger, m.content );

		if ( rset.embed ) {
			return Embeds.replyEmbed( m, resp, rset.embed );
		} else return m.channel.send( resp);

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

		if ( regExTest.test( trig )) {
			this.addRegEx( trig, react, m.author.id, embedUrl );
		} else this.addString( trig, react, m.author.id, embedUrl );

		await this.storeReacts();

		if ( react ) return m.channel.send( 'Okie Dokie: ' + trig + " -> " + react );
		else return m.channel.send( 'Reaction set.')

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

			if ( regExTest.test(trig) === true ) res = this.removeReact( this.reMap, trig, which, true );
			else res = this.removeReact( this.reactions, trig, which );

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
	 * Display all information for a reaction trigger.
	 * @async
	 * @param {Message} m
	 * @param {string} trig - Reaction trigger.
	 * @param {number} [page=1] - The page of text.
	 * @returns {Promise}
	 */
	async cmdReacts( m, trig, page=1 ) {

		let reacts = this.getReactions( trig );
		if ( !reacts ) return m.channel.send( 'No reaction found.');

		let resp = await this.infoString( reacts );

		let pageText = Display.pageString( resp );

		// get a single page of the response.
		resp = Display.getPageText( resp, page-1 );

		// append reaction count.
		if (  Array.isArray(reacts) ) resp += `\n\n${reacts.length} total reactions`;
		resp += '\n\n' + pageText;

		return m.channel.send( resp );

	}

	/**
	 * Get all custom defined triggers.
	 * @param {Message} m
	 * @param {number} [page=1]
	 * @returns {Promise}
	 */
	async cmdTriggers( m, page=1 ) {

		// list of all triggers defined for server.
		let triggers = this.getTriggers();

		if ( triggers.length <= 0 ) {
			return m.channel.send( 'No custom reactions found.' );
		} else {

			let pageText = Display.pageString( triggers.join('\n') );
			pageText = Display.getPageText( pageText, page-1 );

			pageText += '\n\n' + pageText.length + ' triggers defined.';

			return m.channel.send( pageText );

		}

	}

	/**
	 * Removes a reaction for the given trigger. If no reaction is specified, the reaction trigger will be removed if the given trigger
	 * has only a single reaction entry.
	 * @param {Map<string,ReactSet>} map
	 * @param {string} trig - The reaction trigger to remove a reaction from.
	 * @param {string|null|undefined} reaction - The reaction string to remove.
	 * @param {boolean} [isRegex=false] - If the trigger is a regular expression.
	 * @returns {bool|number} true if a reaction is removed.
	 * If multiple reactions match, none are removed, and the number found is returned.
	 * If no matching trigger/reaction pair is found, false is returned.
	 */
	removeReact( map, trig, reaction, isRegex=false) {

		if ( isRegex===false ) trig = trig.toLowerCase();

		let rset = map.get( trig );
		if ( rset === undefined ) return false;

		let res = rset.tryRemove( reaction );
		if ( res === true && rset.isEmpty()) map.delete( trig );

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
	 * Regex reacts use standard JS regular expressions within quote marks "\^w+\" etc.
	 * Reactions can contain $n substitution groups where n is a 1-indexed group from the regular expression.
	 * @param {string} trig - regex trigger for reaction.
	 * @param {string} react
	 * @param {string} uid - discord id of creator.
	 * @param {string} [embedUrl=null] - url of linked attachment/embed.
	 */
	addRegEx( trig, react, uid, embedUrl=null ) {

		let rset = this.reMap.get( trig );

		if ( rset === undefined ) {

			let regex = toRegEx(trig);	// takes flags into account.

			rset = new ReactSet( regex );
			// @note map key is string. ReactSet trigger is regex.
			this.reMap.set( trig, rset );

		}
		rset.add( react, uid, embedUrl );

	}

	/**
	 * Add a string-trigger reaction.
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
	 * Find a reaction set for the given input text.
	 * @param {string} str - Message to react to.
	 * @returns {ReactSet|null} Reaction string for the message, or null
	 * if no match found.
	 */
	findSet( str ) {

		let rset = this.tryRegEx( this.reMap, str );
		if ( rset !== null ) return rset;

		rset = this.tryRegEx( globalRegEx, str );
		if ( rset !== null ) return rset;

		str = str.toLowerCase();
		rset = this.tryReact( this.reactions, str );
		if ( rset !== null ) return rset;

		return this.tryReact( globalReacts, str );

	}

	/**
	 *
	 * @param {Map<string,ReactSet>} map
	 * @param {string} str - input string to test.
	 * @returns {ReactSet|null} string reaction or null.
	 */
	tryReact( map, str ) {

		for( let k of map.keys() ) {

			if ( str.indexOf(k) >= 0 ) {

				var rset = map.get(k);
				if ( rset !== undefined ) return rset;

			}

		}
		return null;
	}

	/**
	 * Determine if string matches a regex trigger.
	 * @param {Map<RegEx,Reaction>} reMap - Map of regular expressions being tested.
	 * @param {string} str - string being tested.
	 * @returns {ReactSet|null}
	 */
	tryRegEx( map, str ) {

		for( let rset of map.values() ) {

			if ( rset.trigger.test( str ) === true ) {

				return rset;

			}

		} //
		return null;

	}

	/**
	 * Return a string of information for the given reaction object.
	 * @async
	 * @param {string|object|Array} react
	 * @param {boolean} [details=false] return extended reaction details.
	 * @returns {Promise<string>}
	 */
	async infoString( react, details=false ) {

		if ( react === null || react === undefined ) return '';
		if ( typeof react === 'string' ) return react + ( details ? ' ( Creator unknown )' : '' );

		var resp = '';

		if ( Array.isArray(react) ) {

			let len = react.length;
			for( let i = 0; i < len; i++ ) {
				resp += '\n\n' + (i+1) + ') ' + ( await this.infoString( react[i], details ) );
			}
			return resp;

		} else if ( typeof react === 'object' ) {

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
	 * @returns {string[]} - array of all string/regex string triggers.
	 */
	getTriggers() {

		let a = [];

		for( let p of this.reMap.keys() ) {
			a.push( p );
		}

		for( let p of this.reactions.keys() ) {
			a.push(p);
		}

		return a;
	}

	/**
	 *
	 * @param {string} trig - trigger for the reaction.
	 * @param {string|null} [reactStr=null] - the reaction string to return, or null to return all reactions for
	 * the given trigger.
	 * @returns {Reaction|Reaction[]|null} Returns the single reaction found, or an array of reactions
	 * if no reactStr is specified.
	 * Returns false if no reactions match the trigger or trigger/reactStr combination.
	 */
	getReactions( trig, reactStr=null ) {

		if ( !trig ) return false;

		let rset = this.reMap.get(trig);
		if ( rset === undefined ) {
			rset = this.reactions.get( trig.toLowerCase() );
			if ( rset === undefined ) return null;
		}

		return rset.findReactions( reactStr );

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
		strings:parseStrings( reactData.strings||reactData ),
		regex:parseRe(reactData.regex)
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
 * Initialize plugin.
 * @param {DiscordBot} bot
 */
exports.init = function( bot ) {

	console.log( 'loading reacts.');

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
		{ minArgs:1, maxArgs:2, group:'left' });

	bot.addContextCmd( 'triggers', 'triggers [page]',
	GuildReactions.prototype.cmdTriggers, GuildReactions,
	{ minArgs:0, maxArgs:1, group:'left' });

	bot.addContextCmd( 'rmreact', 'rmreact <\"react trigger\"> [response]',
		GuildReactions.prototype.cmdRmReact, GuildReactions,
		{ minArgs:1, maxArgs:2, group:'right', access:2 } );

}