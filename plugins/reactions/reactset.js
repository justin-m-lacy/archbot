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
	 * @returns {string|Object} A reaction string from the set, or a reaction Object with included embed url.
	 */
	getReact() {

		let resp = this._reacts;
		if ( resp instanceof Array ) resp = resp[ Math.floor( resp.length*Math.random())];

		if ( resp instanceof Object ) {

			// return full response Object so embed can be included in result.
			if ( resp.embed ) return resp;
			else resp = resp.r;

		}

		// should be string now.
		if ( typeof resp !== 'string') return resp.toString();
		return resp;

	}

	/**
	 * Replace the reaction text with $ groups replaced from
	 * groups from the original trigger regex.
	 * @param {string} text 
	 */
	replaceReact( text ) {

		var res, resLen;
		let resp = this.getReact();		// react template.

		this._trigger.lastIndex = 0;	// reset from test()

		// TODO: Global option?
		if ( ( res = this._trigger.exec(text)) !== null ) {

			resLen = res.length;
			// replace $ stubs.
			resp = resp.replace( stubReplace, function( match, p1, ){

				let n = Number( p1 );
				if ( Number.isNaN(n) === true ) {

					if ( p1 === '`') return text.slice(0, res.index );
					else if ( p1 === "'") return text.slice( this._trigger.lastIndex );	// TODO: Wrong.
					else if ( p1 === '&') return res[0];

				} else if ( n < resLen ) return res[n];

				return match;

			});

		}

		return resp;

	}

	/**
	 * Get a regex reaction, using substring matches to perform
	 * replacements in react text.
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace
	 */
	textReplace( text ) {
		return text.replace( this._trigger, this.getReact() );
	}

	isEmpty() {
		return this._reacts === null || 
		((this._reacts instanceof Array ) && this._reacts.length === 0);
	}

	/**
	 * 
	 * @param {string} react - reaction string.
	 * @param {string} uid - disord user snowflake.
	 * @param {string} [embedUrl=null] - url of attachment or embed to include in reaction.
	 */
	add( react, uid, embedUrl=null ) {

		react = { r:react, uid:uid, t:Date.now(), embed:embedUrl };

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

module.exports = ReactSet;