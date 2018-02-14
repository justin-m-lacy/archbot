
exports.Dispatch = class CmdDispatch {

	get commands() { return this._cmds; }
	constructor( cmdPrefix='!') {

		this._cmds = {};
		this.cmdLine = new CmdLine( cmdPrefix );

	}

	// lead args precede any arguments from processed command
	// returns error message on failure.
	process( input, leadArgs=null ) {

		this.cmdLine.input = input;
		console.log( 'cmd: ' + this.cmdLine.cmd );

		let cmdInfo = this.getCmd( this.cmdLine.cmd );

		if ( cmdInfo ) {

			var args;
			if ( cmdInfo.group === 'left') args = this.cmdLine.groupLeft( cmdInfo.maxArgs );
			else args = this.cmdLine.groupRight( cmdInfo.maxArgs );

			if ( leadArgs != null ){
				args = leadArgs.concat(args);
			}

			let cmd = cmdInfo.cmd;
			if ( cmd != null ) {
				cmd.apply( null, args );
				return null;
			}

		}
		return 'Command not found';

	}

	// group - group arguments on right or left
	add( label, cmd, minArgs, maxArgs, usage, group='left') {

		this._cmds[label] = { cmd:cmd, minArgs:minArgs, maxArgs:maxArgs, usage:usage, group:group };
	}

	getCmd( label ) {

		if ( this._cmds.hasOwnProperty( label )) {
			return this._cmds[label];
		}
		return null;

	}

	clearCmd( label ) {
		delete this._cmds[label];
	}

	clear() {
		this._cmds = {};
	}

}

class CmdLine {

	set input( str ) {

		str = str.trim();
		this._input = str;

		let ind = str.indexOf( ' ', this._prefixLen );
		console.log( 'setting input: ' + str );

		if ( ind >= 0 ) {

			this._cmd = str.slice( this._prefixLen, ind );
			this._argStr = str.slice(ind);
	
		} else {

			this._cmd = str.slice( this._prefixLen );
			this._argStr = '';

		}

	}

	get cmd() {
		return this._cmd;
	}

	constructor( cmdPrefix='!' ) {
	
		this._prefix = cmdPrefix;
		this._prefixLen = cmdPrefix ? cmdPrefix.length : 0;

		this._input = '';
		this._cmd = '';
		this._argStr = '';

	}

	// groups args on right to max count.
	groupRight( argCount ) {

		let str = this._argStr;

		var args = [];
		let len = str.length;
		let start = 0;
		let end;
		let char;

		while( true ) {

			// skip spaces.
			while ( start < len && str.charAt(start) == ' ' ) start++;
			if ( start >= len ) break;

			argCount--;
			if ( argCount <= 0 ) {
				if ( start < len ) args.push( this.trimQuote( str.slice(start) ) );
				break;
			}

			char = str.charAt( start );
			end = start + 1;

			if ( char == '\"') {

				// quoted arg.
				while ( end < len && str.charAt(end) != '\"') end++;
				args.push( str.slice( start+1, end ) );

			} else {

				while ( end < len && str.charAt(end) != ' ' ) end++;
				args.push( str.slice( start, end ) );
			}

			start = end+1;

		}

		return args;

	}

	// groups args on left to max count.
	groupLeft( argCount ) {

		let str = this._argStr;

		var args = [];
		let start = str.length-1;
		let end;
		let char;

		while( true ) {

			// skip spaces.
			while ( start <= 0 && str.charAt(start) == ' ' ) start--;
			if ( start <= 0 ) break;

			argCount--;
			if ( argCount <= 0 ) {
				if ( start >= 0 ) args.unshift( this.trimQuote( str.slice(0,start+1) ) );
				break;
			}

			char = str.charAt( start );
			end = start - 1;

			if ( char == '\"') {

				// quoted arg.
				while ( end >= 0 && str.charAt(end) != '\"') end--;
				args.unshift( str.slice( end+1, start ) );

			} else {

				while ( end >= 0 && str.charAt(end) != ' ' ) end--;
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
			while ( start < len && str.charAt(start) == ' ' ) start++;
			if ( start >= len ) return args;

			char = str.charAt( start );
			end = start+1;
			if ( char == '\"') {

				// quoted arg.
				while ( end < len && str.charAt(end) != '\"') end++;
				args.push( str.slice(start+1, end ) );

			} else {

				while ( end < len && str.charAt(end) != ' ' ) end++;
				args.push( str.slice( start, end ) );
			}

			start = end+1;

		}

	}

}