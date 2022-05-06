const Command = require('./command.js');

const QuoteRE = /“|”/g;

/**
 * @const {RegExp} SplitRE - splits input line into arguments.
 */
//const SplitRE = /"([^"]*)"|“([^”]*)”|\s*\b([^"]+)\b/g;

module.exports = class CmdDispatch {

	/**
	 * {string}
	 */
	get prefix() { return this.cmdLine.prefix; }

	/**
	 *
	 * @param {string} cmdPrefix
	 */
	constructor(cmdPrefix = '!') {

		this.cmdLine = new CmdLine(cmdPrefix);

	}

	/**
	 * @returns {Object[string->Command]} - Map of all active commands.
	 */
	getCommands() { return this.cmdLine.commands; }

	/**
	 *
	 * @param {string} name
	 * @returns {(Command|null)}
	 */
	getCommand(name) { return this.cmdLine.getCommand(name); }

	/**
	 * Parse a line of input.
	 * @param {string} input - text input.
	 * @returns {Command|null} - command found on input, or null.
	 */
	parseLine(input) {
		return this.cmdLine.setInput(input);
	} //

	/**
	 *
	 * @param {Command} cmd
	 * @param {Array} leadArgs
	 */
	dispatch(cmd, leadArgs) {

		let lineArgs = this.cmdLine.args;
		if (lineArgs) leadArgs = leadArgs.concat(lineArgs);

		if (cmd.args) cmd.func.apply(null, leadArgs.concat(cmd.args));
		else cmd.func.apply(null, leadArgs);

	}

	/**
	 *
	 * @param {BotContext} context
	 * @param {Command} cmd
	 * @param {Array} leadArgs
	 * @returns {Promise}
	 */
	routeCmd(context, cmd, leadArgs) {

		let lineArgs = this.cmdLine.args;
		if (lineArgs) leadArgs = leadArgs.concat(lineArgs);

		if (cmd.args) return context.routeCommand(cmd, leadArgs.concat(cmd.args));
		return context.routeCommand(cmd, leadArgs);
	}

	/**
	 *
	 * @param {string} name - Name of command.
	 * @param {string} desc - Command Usage details.
	 * @param {function} func - Function to call.
	 * @param {Class} cmdClass - Class which owns the function.
	 * @param {Object} opts - Command options.
	 * @param {number} [opts.minArgs] @param {number} [opts.maxArgs] @param {bool}[opts.hidden] @param {string}[opts.group]
	 * @param {*[]} [opts.args] - Arguments to pass after all other arguments to command.
	 */
	addContextCmd(name, desc, func, cmdClass, opts = null) {

		try {
			let cmd = new Command(name, func, opts);
			cmd.desc = desc;
			cmd.instClass = cmdClass;
			this.regCmd(cmd);
		} catch (e) { console.error(e); }

	}

	/**
	 *
	 * @param {string} name
	 * @param {string} desc
	 * @param {Function} func
	 * @param {Object} [opts=null]
	 */
	add(name, desc, func, opts = null) {

		try {

			//console.log( 'static command: ' + name );
			let cmd = new Command(name, func, opts);
			cmd.desc = desc;
			this.regCmd(cmd);

		} catch (e) { console.error(e); }

	}

	/**
	 *
	 * @param {Command} cmd
	 */
	regCmd(cmd: Command) {

		this.cmdLine.commands[cmd.name] = cmd;
		let alias = cmd.alias;
		if (alias) {

			if (typeof (alias) === 'string') this.cmdLine.commands[alias] = cmd;
			else if (Array.isArray(alias))
				for (let i = alias.length - 1; i >= 0; i--) this.cmdLine.commands[alias[i]] = cmd;

		}

	}

	/**
	 * {Object[string->command]}
	 */
	get commands() { return this.cmdLine.commands; }

	/**
	 *
	 * @param {string} name
	 */
	clearCmd(name) { delete this.commands[name]; }

}

class CmdLine {

	/**
	 * { .<string,Command> } - All active commands.
	 */
	get commands() { return this._cmds; }

	/**
	 * @property {string[]} args - current arguments on command line.
	 */
	get args() { return this._args; }

	/**
	 * @property {string} prefix - bot command prefix.
	 */
	get prefix() { return this._prefix; }

	/**
	 *
	 * @param {string} name
	 */
	getCommand(name) {
		return this._cmds[name.toLowerCase()];
	}

	constructor(cmdPrefix = '!') {

		this._prefix = cmdPrefix;
		this._prefixLen = cmdPrefix ? cmdPrefix.length : 0;

		this._cmds = {};

	}

	/**
	 *
	 * @param {string} str
	 * @returns {Command|null} The command found on the input line.
	 */
	setInput(str) {

		str = str.trim();

		// cmd prefix.
		if (str.slice(0, this._prefixLen) !== this._prefix) return null;

		let cmd, ind = str.indexOf(' ', this._prefixLen);
		if (ind < 0) {

			cmd = this._cmds[str.slice(this._prefixLen).toLowerCase()];
			this._args = null;

		} else {

			cmd = this._cmds[str.slice(this._prefixLen, ind).toLowerCase()];
			if (!cmd) return null;

			this.readArgs(str.slice(ind), cmd);

		}

		return cmd;

	}

	readArgs(argstr, cmd) {

		argstr = argstr.replace(QuoteRE, '"');

		if (!cmd.maxArgs) this._args = this.splitArgs(argstr);
		else {
			if (cmd.group === 'right') this._args = this.groupRight(argstr, cmd.maxArgs);
			else this._args = this.groupLeft(argstr, cmd.maxArgs);
		}

	}

	/**
	 * Split input into args without limit.
	 * @param {*} str
	 */
	splitAll(str) {

		var res;

		var args = [];

		while (res = splitRE.exec(str)) {

			args.push(res[0]);

			/*for( let i = 1; i < res.length; i++ ) {

				if ( res[i] !== undefined ) {
					args.push(res[i]);
					break;
				}
			}*/

		}

		return args;

	}

	splitArgs(str) {

		var args = [];
		let len = str.length;
		let start = 0;
		let end;
		let char;

		while (true) {

			// skip spaces.
			while (start < len && str.charAt(start) === ' ') start++;
			if (start >= len) break;

			char = str.charAt(start);
			end = start + 1;

			if (char === '"') {

				// quoted arg.
				while (end < len && str.charAt(end) !== '"') end++;
				args.push(str.slice(start + 1, end));

			} else {

				while (end < len && str.charAt(end) !== ' ') end++;
				args.push(str.slice(start, end));
			}

			start = end + 1;

		}

		return args;

	}


	// groups args on right to max count.
	groupRight(str, argCount) {

		var args = [];
		let len = str.length;
		let start = 0;
		let end;
		let char;

		while (true) {

			// skip spaces.
			while (start < len && str.charAt(start) === ' ') start++;
			if (start >= len) break;

			argCount--;
			if (argCount <= 0) {
				if (start < len) args.push(this.trimQuote(str.slice(start)));
				break;
			}

			char = str.charAt(start);
			end = start + 1;

			if (char === '"') {

				// quoted arg.
				while (end < len && str.charAt(end) !== '"') end++;
				args.push(str.slice(start + 1, end));

			} else {

				while (end < len && str.charAt(end) !== ' ') end++;
				args.push(str.slice(start, end));
			}

			start = end + 1;

		}

		return args;

	}

	// groups args on left to max count.
	groupLeft(str, argCount) {

		var args = [];
		let start = str.length - 1;
		let end;
		let char;

		while (true) {

			// skip spaces.
			while (start >= 0 && str.charAt(start) === ' ') start--;
			if (start <= 0) break;

			argCount--;
			if (argCount <= 0) {
				if (start >= 0) args.unshift(this.trimQuote(str.slice(0, start + 1)));
				break;
			}

			char = str.charAt(start);
			end = start - 1;

			if (char === '"') {

				// quoted arg.
				while (end >= 0 && str.charAt(end) !== '"') end--;
				args.unshift(str.slice(end + 1, start));

			} else {

				while (end >= 0 && str.charAt(end) !== ' ') end--;
				args.unshift(str.slice(end + 1, start + 1));
			}

			start = end - 1;

		}

		return args;

	}

	trimQuote(str) {

		str = str.trim();
		let len = str.length;
		let start = 0;
		if (len > 0 && str.charAt(0) === '"') start++;
		let end = len - 1;
		if (end > 0 && str.charAt(end) === '"') end--;

		if (end < start) return '';
		return str.slice(start, end + 1);

	}

	/// splits arguments, allowing quote marks.
	getArgs() {

		let str = this._argStr;
		var args = [];
		var len = str.length;
		let start = 0;
		let end;
		let char;

		while (true) {

			// skip spaces.
			while (start < len && str.charAt(start) === ' ') start++;
			if (start >= len) return args;

			char = str.charAt(start);
			end = start + 1;
			if (char === '"') {

				// quoted arg.
				while (end < len && str.charAt(end) !== '"') end++;
				args.push(str.slice(start + 1, end));

			} else {

				while (end < len && str.charAt(end) !== ' ') end++;
				args.push(str.slice(start, end));
			}

			start = end + 1;

		}

	}

}