import Command from './command';
import { BotContext, ContextSource } from './botcontext';

const QuoteRE = /“|”/g;

export type CommandOpts = Partial<Command>;

/**
 * @const {RegExp} SplitRE - splits input line into arguments.
 */
//const SplitRE = /"([^"]*)"|“([^”]*)”|\s*\b([^"]+)\b/g;

export default class CmdDispatch {

	/**
	 * {string}
	 */
	get prefix() { return this.cmdLine.prefix; }

	private cmdLine: CmdLine;

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
	getCommand(name: string) { return this.cmdLine.getCommand(name); }

	/**
	 * Parse a line of input.
	 * @param {string} input - text input.
	 * @returns {Command|null} - command found on input, or null.
	 */
	parseLine(input: string) {
		return this.cmdLine.setInput(input);
	} //

	/**
	 *
	 * @param {Command} cmd
	 * @param {Array} leadArgs
	 */
	dispatch(cmd: Command, leadArgs: any[]) {

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
	routeCmd<T extends ContextSource>(context: BotContext<T>, cmd: Command, leadArgs: any[]) {

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
	addContextCmd(name: string, desc: string, func: Function, cmdClass: any, opts?: CommandOpts) {

		try {
			let cmd = new Command(name, func, {
				desc: desc,
				instClass: cmdClass,
				...opts
			});
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
	add(name: string, desc: string, func: Function, opts?: CommandOpts) {

		try {

			//console.log( 'static command: ' + name );
			let cmd = new Command(name, func, { desc: desc, ...opts });
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
			else if (Array.isArray(alias)) {
				alias.every(v => this.cmdLine.commands[v] = cmd);
			}

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
	clearCmd(name: string) { return delete this.commands[name]; }

}

class CmdLine {

	readonly _cmds: { [name: string]: Command } = {};
	get commands() { return this._cmds; }

	/**
	 * @property {string[]} args - current arguments on command line.
	 */
	get args() { return this._args; }

	private _args?: string[] | null;

	/**
	 * @property {string} prefix - bot command prefix.
	 */
	readonly prefix: string;

	/**
	 * Length of command prefix.
	 */
	private readonly _prefixLen: number;

	constructor(cmdPrefix = '!') {

		this.prefix = cmdPrefix;
		this._prefixLen = cmdPrefix ? cmdPrefix.length : 0;

	}

	/**
	 *
	 * @param {string} name
	 */
	getCommand(name: string) {
		return this._cmds[name.toLowerCase()];
	}


	/**
	 *
	 * @param {string} str
	 * @returns {Command|null} The command found on the input line.
	 */
	setInput(str: string) {

		str = str.trim();

		// cmd prefix.
		if (str.slice(0, this._prefixLen) !== this.prefix) return null;
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

	readArgs(argstr: string, cmd: Command) {

		argstr = argstr.replace(QuoteRE, '"');

		if (!cmd.maxArgs) this._args = this.splitArgs(argstr);
		else {
			if (cmd.group === 'right') this._args = this.groupRight(argstr, cmd.maxArgs);
			else this._args = this.groupLeft(argstr, cmd.maxArgs);
		}

	}

	splitArgs(str: string) {

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
	groupRight(str: string, argCount: number) {

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
	groupLeft(str: string, argCount: number) {

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

	trimQuote(str: string) {

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
	/*getArgs() {

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

	}*/

}