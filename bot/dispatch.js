const Command = require( './command.js');

module.exports = class CmdDispatch {

	constructor( cmdPrefix='!') {

		this.cmdLine = new CmdLine( cmdPrefix );

	}

	/**
	 * @returns {Object[string->Command]} - Map of all active commands.
	 */
	getCommands() { return this.cmdLine.commands; }

	/**
	 * 
	 * @param {string} name
	 * @returns {Command|null}
	 */
	getCommand( name ) { return this.cmdLine.getCommand(name); }

	/**
	 * 
	 * @param {string} input - command line input.
	 */
	parseLine( input ) {
		return this.cmdLine.setInput(input);
	} //

	/**
	 * 
	 * @param {Command} cmd 
	 * @param {Array} leadArgs 
	 */
	dispatch( cmd, leadArgs ) {

		let lineArgs = this.cmdLine.args;
		if ( lineArgs ) leadArgs = leadArgs.concat( lineArgs );

		if ( cmd.args ) cmd.func.apply( null, leadArgs.concat( cmd.args ) );
		else cmd.func.apply( null, leadArgs );

	}

	/**
	 * 
	 * @param {BotContext} context 
	 * @param {Command} cmd 
	 * @param {Array} leadArgs 
	 */
	routeCmd( context, cmd, leadArgs ) {

		let lineArgs = this.cmdLine.args;
		if ( lineArgs ) leadArgs = leadArgs.concat( lineArgs );

		if ( cmd.args ) return context.routeCommand( cmd, leadArgs.concat( cmd.args ) );
		return context.routeCommand( cmd, leadArgs );
	}

	/**
	 * 
	 * @param {string} name - Name of command.
	 * @param {string} usage - Command Usage details.
	 * @param {function} func - Function to call.
	 * @param {Class} cmdClass - Class which owns the function.
	 * @param {Object} opts - Command options.
	 * @param {number} [opts.minArgs] @param {number} [opts.maxArgs] @param {bool}[opts.hidden] @param {string}[opts.group]
	 * @param {*[]} [opts.args] - Arguments to pass after all other arguments to command.
	 */
	addContextCmd( name, usage, func, cmdClass, opts=null ) {

		//console.log('ADDING CONTEXT COMAND: ' + name );
		try {
			let cmd = new Command( name, func, opts );
			cmd.usage = usage;
			cmd.instClass = cmdClass;
			this.regCmd( cmd );
		} catch(e) { console.log(e); }

	}

	/**
	 * 
	 * @param {string} name 
	 * @param {string} usage 
	 * @param {Function} func 
	 * @param {Object} [opts=null] 
	 */
	add( name, usage, func, opts=null ) {

		try {
			//console.log( 'static command: ' + name );
			let cmd = new Command( name, func, opts );
			cmd.usage = usage;
			this.regCmd( cmd );
		} catch(e) { console.log(e); }

	}

	/**
	 * 
	 * @param {Command} cmd 
	 */
	regCmd( cmd ) {
	
		this.cmdLine.commands[ cmd.name ] = cmd;
		let alias = cmd.alias;
		if ( alias ) {

			if ( typeof(alias) === 'string') this.cmdLine.commands[ alias ] = cmd;
			else if ( alias instanceof Array )
				for( let i = alias.length-1; i >= 0; i-- ) this.cmdLine.commands[ alias[i] ] = cmd;

		}

	}

	get commands() { return this.cmdLine.commands; }

	/**
	 * 
	 * @param {string} name 
	 */
	getCmd( name ) { return this._cmds[name]; }

	/**
	 * 
	 * @param {string} name 
	 */
	clearCmd( name ) { delete this._cmds[name];	}

}

class CmdLine {

	/**
	 * { Object[string->Command] } - All active commands.
	 */
	get commands() { return this._cmds; }

	get args() { return this._args; }
	get prefix() { return this._prefix; }

	get command() { return this._cmd; }

	/**
	 * 
	 * @param {string} name 
	 */
	getCommand( name ) {
		return this._cmds[name.toLowerCase()] || null;
	}

	constructor( cmdPrefix='!' ) {
	
		this._prefix = cmdPrefix;
		this._prefixLen = cmdPrefix ? cmdPrefix.length : 0;

		this._cmds = {};

	}

	/**
	 * 
	 * @param {string} str 
	 */
	setInput( str ) {

		str = str.trim();

		// cmd prefix.
		if ( str.slice( 0, this._prefixLen ) !== this._prefix ) {

			this._cmd = null;
			return;

		}
		
		let ind = str.indexOf( ' ', this._prefixLen );
		if ( ind < 0 ){

			this._cmd = this._cmds[ str.slice( this._prefixLen ).toLowerCase() ];
			this._args = null;
			return this._cmd;

		}

		this._cmd = this._cmds[ str.slice( this._prefixLen, ind ).toLowerCase() ];
		if ( !this._cmd ) return;

		this.readArgs( str.slice( ind ), this._cmd );


		return this._cmd;

	}

	readArgs( argstr, cmd ) {
		
		argstr = argstr.replace( /“|”/g, '\"');

		if ( !cmd.maxArgs ) this._args = this.splitArgs( argstr );
		else {
			if ( cmd.group === 'right') this._args = this.groupRight( argstr, cmd.maxArgs );
			else this._args = this.groupLeft( argstr, cmd.maxArgs );
		}

	}

	splitArgs( str ) {

		var args = [];
		let len = str.length;
		let start = 0;
		let end;
		let char;

		while( true ) {

			// skip spaces.
			while ( start < len && str.charAt(start) === ' ' ) start++;
			if ( start >= len ) break;

			char = str.charAt( start );
			end = start + 1;

			if ( char == '\"') {

				// quoted arg.
				while ( end < len && str.charAt(end) !== '\"') end++;
				args.push( str.slice( start+1, end ) );

			} else {

				while ( end < len && str.charAt(end) !== ' ' ) end++;
				args.push( str.slice( start, end ) );
			}

			start = end+1;

		}

		return args;

	}

	// groups args on right to max count.
	groupRight( str, argCount ) {

		var args = [];
		let len = str.length;
		let start = 0;
		let end;
		let char;

		while( true ) {

			// skip spaces.
			while ( start < len && str.charAt(start) === ' ' ) start++;
			if ( start >= len ) break;

			argCount--;
			if ( argCount <= 0 ) {
				if ( start < len ) args.push( this.trimQuote( str.slice(start) ) );
				break;
			}

			char = str.charAt( start );
			end = start + 1;

			if ( char === '\"') {

				// quoted arg.
				while ( end < len && str.charAt(end) !== '\"') end++;
				args.push( str.slice( start+1, end ) );

			} else {

				while ( end < len && str.charAt(end) !== ' ' ) end++;
				args.push( str.slice( start, end ) );
			}

			start = end+1;

		}

		return args;

	}

	// groups args on left to max count.
	groupLeft( str, argCount ) {

		var args = [];
		let start = str.length-1;
		let end;
		let char;

		while( true ) {

			// skip spaces.
			while ( start >= 0 && str.charAt(start) === ' ' ) start--;
			if ( start <= 0 ) break;

			argCount--;
			if ( argCount <= 0 ) {
				if ( start >= 0 ) args.unshift( this.trimQuote( str.slice(0,start+1) ) );
				break;
			}

			char = str.charAt( start );
			end = start - 1;

			if ( char === '\"') {

				// quoted arg.
				while ( end >= 0 && str.charAt(end) !== '\"') end--;
				args.unshift( str.slice( end+1, start ) );

			} else {

				while ( end >= 0 && str.charAt(end) !== ' ' ) end--;
				args.unshift( str.slice( end+1, start+1 ) );
			}

			start = end-1;

		}

		return args;

	}

	trimQuote( str ) {

		str = str.trim();
		let len = str.length;
		let start = 0;
		if ( len > 0 && str.charAt(0) === '\"' ) start++;
		let end = len-1;
		if ( end > 0 && str.charAt(end) === '\"') end--;
	
		if ( end < start ) return '';
		return str.slice(start,end+1);

	}

	/// splits arguments, allowing quote marks.
	getArgs() {

		let str = this._argStr;
		var args = [];
		var len = str.length;
		let start = 0;
		let end;
		let char;

		while( true ) {

			// skip spaces.
			while ( start < len && str.charAt(start) === ' ' ) start++;
			if ( start >= len ) return args;

			char = str.charAt( start );
			end = start+1;
			if ( char === '\"') {

				// quoted arg.
				while ( end < len && str.charAt(end) !== '\"') end++;
				args.push( str.slice(start+1, end ) );

			} else {

				while ( end < len && str.charAt(end) !== ' ' ) end++;
				args.push( str.slice( start, end ) );
			}

			start = end+1;

		}

	}

}