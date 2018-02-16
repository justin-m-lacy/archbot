
const Command = exports.Command = class {

	/**
	 * opts.type: 'global', or 'instance'
	 * maxArgs: max arguments to form from command line.
	 * minArgs: not implemented.
	 * group: 'left' or 'right' when using maxArgs, determines
	 * how remainder args are grouped together.
	 */
	get opts() { return this._opts;}

	get name() { return this._name; }
	get func() { return this._func };
	get usage() { return this._usage; }

	get type() { return (this._opts ? this._opts.type : 'global' );}

	constructor( name, usage, func=null, opts=null ) {

		this._name = name;
		this._func = func;
		this._usage = usage;
		this._opts = opts;

	}

}

exports.Dispatch = class CmdDispatch {

	get commands() { return this._cmds; }
	constructor( cmdPrefix='!') {

		this._cmds = {};
		this.cmdLine = new CmdLine( cmdPrefix );

	}

	routeCmd( context, input, leadArgs=null ) {

		this.cmdLine.input = input;
		console.log( 'cmd: ' + this.cmdLine.cmdname );

		let cmd = this.getCmd( this.cmdLine.cmdname );

		if ( cmd ) {

			var args;
			if ( cmd.maxArgs == null ) args = this.cmdLine.splitArgs();
			else {
				if ( cmd.group === 'left') args = this.cmdLine.groupLeft( cmd.maxArgs );
				else args = this.cmdLine.groupRight( cmd.maxArgs );
			}

			if ( leadArgs != null ){
				args = leadArgs.concat(args);
			}

			let f = cmd.func;
			if ( cmd.type != 'instance') {
				f.apply( null, args );
				return null;
			} else {
				return context.routeCommand( cmd.name, f, args );
			}

		}
		return 'Command not found';

	}

	// group - group arguments on right or left
	add( name, usage, func, opts ) {

		this._cmds[name] = new Command( name, usage, func, opts );

	}

	getCmd( name ) {
		return this._cmds[name];
	}

	clearCmd( name ) {
		delete this._cmds[name];
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

		if ( ind >= 0 ) {

			this._cmd = str.slice( this._prefixLen, ind ).toLowerCase();
			this._argStr = str.slice(ind);
	
		} else {

			this._cmd = str.slice( this._prefixLen ).toLowerCase();
			this._argStr = '';

		}

	}

	get cmdname() {
		return this._cmd;
	}

	constructor( cmdPrefix='!' ) {
	
		this._prefix = cmdPrefix;
		this._prefixLen = cmdPrefix ? cmdPrefix.length : 0;

		this._input = '';
		this._cmd = '';
		this._argStr = '';

	}

	splitArgs() {

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