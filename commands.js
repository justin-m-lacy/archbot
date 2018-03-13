
const Command = exports.Command = class {

	/**
	 * maxArgs: max arguments to form from command line.
	 * minArgs: not implemented.
	 * group: 'left' or 'right' when using maxArgs, determines
	 * how remainder args are grouped together.
	 */
	get opts() { return this._opts;}
	set opts( o ) { this._opts = o; }

	get name() { return this._name; }

	// whether the cmd calls a function directly.
	get isDirect() { return this._instClass == null; }
	get isContext() { return this._instClass != null; }

	get instClass() { return this._instClass; }

	get func() { return this._func };
	get usage() { return this._usage ? this._usage : 'Unknown.'; }
	get group() { return this._opts ? this._opts.group : null; }

	// hidden commands not displayed in help list.
	get hidden() { return this._opts? this._opts.hidden : false; }

	get args() { return this._opts? this._opts.args : null; }

	get maxArgs() { return this._opts ? this._opts.maxArgs : null; }

	constructor( name, usage, func, instClass=null ) {

		this._name = name;
		this._func = func;
		this._usage = usage;
		this._instClass = instClass;

	}

}

exports.Dispatch = class CmdDispatch {

	constructor( cmdPrefix='!') {

		this.cmdLine = new CmdLine( cmdPrefix );

	}

	getCommand( input ) {
		return this.cmdLine.setInput(input);
	} //

	dispatch( cmd, leadArgs ) {

		let lineArgs = this.cmdLine.args;
		if ( lineArgs ) leadArgs = leadArgs.concat( lineArgs );

		if ( cmd.args ) cmd.func.apply( null, leadArgs.concat( cmd.args ) );
		else cmd.func.apply( null, leadArgs );

	}

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

		let cmd = new Command( name, usage, func, cmdClass );
		cmd.opts = opts;
		this.cmdLine.commands[name] = cmd;

	}

	// group - group arguments on right or left
	add( name, usage, func, opts=null ) {

		//console.log( 'static command: ' + name );
		let cmd = new Command( name, usage, func );
		cmd.opts = opts;

		this.cmdLine.commands[name] = cmd;

	}

	get commands() { return this.cmdLine.commands; }
	getCmd( name ) { return this._cmds[name]; }
	clearCmd( name ) { delete this._cmds[name];	}
	clear() { this._cmds = {}; }

}

class CmdLine {

	get commands() { return this._cmds; }

	get args() { return this._args; }
	get prefix() { return this._prefix; }

	get command() { return this._cmd; }

	constructor( cmdPrefix='!' ) {
	
		this._prefix = cmdPrefix;
		this._prefixLen = cmdPrefix ? cmdPrefix.length : 0;

		this._cmds = {};

	}

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

		this.readArgs( str.slice( ind ), this._cmd.opts );


		return this._cmd;

	}

	readArgs( argstr, opts ) {
		
		argstr = argstr.replace( /“|”/g, '\"');

		if ( !opts || !opts.maxArgs ) this._args = this.splitArgs( argstr );
		else {
			if ( opts.group === 'right') this._args = this.groupRight( argstr, opts.maxArgs );
			else this._args = this.groupLeft( argstr, opts.maxArgs );
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