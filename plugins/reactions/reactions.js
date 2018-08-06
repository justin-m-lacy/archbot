var globalReacts, globalRegEx;

class ReactSet {

	toJSON(){
		return this._reacts;
	}

	get trigger() { return this._trigger; }
	set trigger(v) { this._trigger = v; }

	get reacts() { return this._reacts; }
	set reacts(v) { this._reacts = v; }

	get lastUsed() { return this._lastUsed; }
	set lastUsed(v) { this._lastUsed = v; }

	constructor( trig, reacts=null ) {

		this._trigger = trig;	// not actually used.

		if ( reacts !== null ) {

			// compatibility with old react versions.
			if ( reacts instanceof Object && !(reacts instanceof Array )) {
				// old response save.
				if ( reacts.r && typeof reacts.r !== 'string' ) {
					//console.log('using oldstyle react: ' + trig + ' -> ' + reacts.r );
					reacts = reacts.r;
				}
			}

		}
		this._reacts = reacts;

	}

	/**
	 * 
	 * @param {string|null} [reactStr=null] - React string to match, or null if
	 * all reactions should be returned.
	 * @returns {false|string|Object|Array} - String or Object information matched,
	 * or Array of all Reactions of reactStr is null, or false if no reaction
	 * matching the string is found.
	 */
	getReactions( reactStr=null ) {

		if ( reactStr === null || reactStr === undefined ) return this._reacts;

		reactStr = reactStr.toLowerCase();

		let obj = this._reacts;

		if ( typeof obj === 'string') {

			if ( reactStr === obj.toLowerCase() ) return obj;

		} else if ( obj instanceof Array ) {

			return obj.find( (elm)=>{
				if ( typeof elm === 'string') return elm.toLowerCase() === reactStr;
				else return ( typeof elm.r === 'string' && elm.r.toLowerCase() === reactStr );
			});

		} else if ( typeof obj.r === 'string' && obj.r.toLowerCase() === reactStr ) return obj;

		return false;

	}

	/**
	 * 
	 * @param {string|RegEx} react - reaction to remove, or null to remove a single reaction,
	 * if only one reaction exists.
	 * @returns {Number|boolean} If no matching reaction is found, returns false.
	 * If a reaction is removed, returns true.
	 * If no match term is specified, and multiple reactions exist, returns the
	 * number of reactions in the set.
	 */
	tryRemove( react=null ) {

		if ( react === null ) {
			
			// removing any single react.
			if ( !(this._reacts instanceof Array) || this._reacts.length === 0 ) this._reacts = null;
			else return this._reacts.length;

		} else {

			if ( this._reacts instanceof Array ) {

				for( let i = this._reacts.length-1; i >= 0; i-- ) {

					if ( this._isMatch( react, this._reacts[i]) === true ) {
						this._splice( this._reacts, i );
						return true;
					}

				}
				return false;

			} else if ( this._isMatch( react, this._reacts ) === true ) this._reacts = null;

		}
		return true;

	}

	/**
	 * @returns {string} A reaction string from the set.
	 */
	getReact() {

		let resp = this._reacts;
		if ( resp instanceof Array ) resp = resp[ Math.floor( resp.length*Math.random())];
		if ( resp instanceof Object ) resp = resp.r;

		// should be string now.
		if ( typeof resp !== 'string') return resp.toString();
		return resp;

	}

	/**
	 * Get a regex reaction, using substring matches to perform
	 * replacements in react text.
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace
	 */
	regExReact( text ) {
		return text.replace( this._trigger, this.getReact() );
	}

	isEmpty() {
		return this._reacts === null || 
		((this._reacts instanceof Array ) && this._reacts.length === 0);
	}

	add( react, uid ) {

		react = { r:react, uid:uid, t:Date.now() };

		if ( this._reacts === null ) this._reacts = react;
		else if ( this._reacts instanceof Array ) this._reacts.push( react );
		else this._reacts = [ this._reacts, react ];

	}

	_splice( a, i ) {

		if ( i === a.length-1 ) a.pop();
		else a[i] = a.pop();

	}

	/**
	 * Tests whether the react string matches the Reaction.
	 * @param {string|RegEx} str 
	 * @param {string|RegEx|Object} react
	 * @returns {bool} Whether the react object matches the string.
	 */
	_isMatch( str, react ) {

		if ( typeof react === 'string' ) return str === react;
		if ( react instanceof Object ) {
			return react.r === str;
		}

		return false;

	}

}

/**
 * Class which handles reactions for a single guild.
 * Instantiated for each Discord Context.
 */
class GuildReactions {

	constructor( context ) {

		this.allReacts = {};

		/**
		 * String->ReactSet
		 */
		this.reactions = new Map();

		/**
		 * RegEx->ReactSet - Reactions based on regular expressions.
		 */
		this.reMap = new Map();

		this._context = context;

		this.loadReactions();

		this._context.onMsg( m=>{

			try {
				// global timeout wait.
				let now = Date.now();
				if ( now - this.gTime < this.gWait ) return;

				this.msgTime = now;

				let resp = this.react(m.content);
				if ( resp !== null ) return m.channel.send( resp );

			} catch(e) { console.log(e); }

		} );

		this.minWait = 1000;
		this.gWait = 500;
		// time last message was recieved.
		this.msgTime = 0;

	}

	/**
	 * 
	 * @param {Message} m 
	 * @param {string} trig 
	 * @param {string} react 
	 */
	async cmdAddReact( m, trig, react ) {

		if ( !trig || !react ) return m.channel.send( 'Usage: !react "string" "response"' );

		let regex = toRegEx( trig );
		if ( regex !== false ) await this.addRegEx( regex, react, m.author.id );
		else await this.addString( trig, react, m.author.id );

		await this.storeReacts();

		return m.channel.send( 'Okie Dokie: ' + trig + " -> " + react );

	}

	/**
	 * 
	 * @param {Message} m 
	 * @param {string} trig - reaction trigger.
	 * @param {string|null|undefined} which 
	 */
	async cmdRmReact( m, trig, which ) {

		if ( trig ) {

			var res;

			if ( isRegEx(trig) === true ) res = this.rmRegEx( trig, which );
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
	 * @param {Message} m 
	 * @param {string} trig - Reaction trigger.
	 * @param {string|null|undefined} which - The specific reaction for the given trigger
	 * to get information for.
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
	rmString( trig, reaction ) {

		trig = trig.toLowerCase();
		let rset = this.reactions.get( trig );

		if ( rset === undefined ) return false;

		let res = rset.tryRemove( reaction );
		if ( res === true && rset.isEmpty()) this.reactions.delete( trig );

		return res;

	}

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

	async storeReacts() {

		return this._context.storeKeyData( this._context.getDataKey( 'reactions', 'reactions'), this.allReacts, true );

	}

	/**
	 * 
	 * @param {RegEx} regex - regular expression which triggers the reaction. 
	 * @param {string} react 
	 * @param {string} uid - discord id of creator.
	 */
	async addRegEx( regex, react, uid ) {

		let rset = this.reMap.get( regex );

		if ( rset === undefined ) {
			rset = new ReactSet( regex );
			this.reMap.set( regex, rset );
		}
		rset.add( react, uid );

	}

	/**
	 * 
	 * @param {string} trig - substring which triggers the reaction.
	 * @param {string} react 
	 * @param {string} uid 
	 */
	async addString( trig, react, uid ) {

		trig = trig.toLowerCase();
		let rset = this.reactions.get(trig);
		if ( rset === undefined ) {
			rset = new ReactSet( trig );
			this.reactions.set( trig, rset );
		}
		rset.add( react, uid );

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
	 * @param {Map( string->ReactSet )} map 
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
	 * @param {Map( RegEx -> Reaction)} reMap - Map of regular expressions being tested.
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

				return rset.regExReact( str );

			}

		} //
		return null;

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
	 * @param {string|regEx} trig - trigger for the reaction.
	 * @param {string|null} reactStr - the reaction string to return, or null to return all reactions for
	 * the given trigger.
	 * @returns {string|object|Array|bool} Returns the single reaction found, or an array of reactions
	 * if no reactStr is specified.
	 * Returns false if no reactions match the trigger or trigger/reactStr combination.
	 */
	getReactions( trig, reactStr=null ) {

		let regex = toRegEx( trig ), rset;
		if ( regex !== false ) rset = this.reMapFind( this.reMap, regex );
		else rset = this.reactions.get( trig.toLowerCase() );

		if ( rset === undefined ) return false;

		return rset.getReactions( reactStr );

	}

	/**
	 * Returns key,value pair for regex->value stored in map.
	 * @param {*} map 
	 * @param {*} regex 
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
	 * @param {} reStr - string describing a regular expression.
	 */
	reMapFind( map, regex ) {

		let reStr = regex.toString();

		for( let k of map.keys() ) {

			//console.log('testing: ' + k.toString() );

			if ( k.toString() === reStr ) return map.get( k );
		}
		return undefined;

	}

	async loadReactions() {

		try {

			let reactData = await this._context.fetchKeyData( this._context.getDataKey( 'reactions', 'reactions' ) );

			if ( !reactData ) return null;
	
			this.allReacts = parseReacts( reactData );

			this.reactions = this.allReacts.strings;
			this.reMap = this.allReacts.regex;

		} catch ( e ) { console.log(e);}

	}

} //

/**
 * 
 * @param {Object} reactData - reaction data.
 * @returns {Object}
 */
function parseReacts( reactData ) {
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

			p = toRegEx( p );
			if ( p !== false ) map.set( p, new ReactSet(p, data[p] ) );

		}

	}

	return map;

}

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
 */
function toRegEx( s ) {

	if ( s === null || s === undefined || s === '' || s.length < 3 ) return false;

	if ( s.charAt(0) === '/' && s.charAt( s.length-1 ) === '/') {

		try {
			return new RegExp( s.slice(1,s.length-1) );
		} catch (e) {}

	}

	return false;
}

/**
 * Function tests if the string is formatted as a regular expression in / / notation.
 * It does not test if the string forms a valid regular expression.
 * @param {string} s 
 */
function isRegEx(s) {

	if ( s === null || s === undefined || s === '' || s.length < 3 ) return false;
	if ( s.charAt(0) === '/' && s.charAt( s.length-1 ) === '/') return true;

	return false;
}

/**
 * Initialize the archbot plugin.
 * @param {DiscordBot} bot 
 */
exports.init = function( bot ) {

	console.log( 'loading Global reactions.');

	let reactData = require('./reactions.json');
	reactData = parseReacts( reactData );

	globalReacts = reactData.strings;
	globalRegEx = reactData.regex;

	bot.addContextClass( GuildReactions );
	bot.addContextCmd( 'react', '!react <\"search trigger\"> <\"response string\">',
		GuildReactions.prototype.cmdAddReact, GuildReactions, { minArgs:2, maxArgs:2, group:'right'} );
	bot.addContextCmd( 'reactinfo', '!reactinfo <\"trigger"\"> [response]',
		GuildReactions.prototype.cmdReactInfo, GuildReactions, { minArgs:1, maxArgs:2, group:'right'});

	bot.addContextCmd( 'rmreact', '!rmreact <\"react trigger\"> [response]', GuildReactions.prototype.cmdRmReact, GuildReactions,
		{ minArgs:1, maxArgs:2, group:'right' } );


}