module.exports = class Command {

	/**
	 * @property {string}
	 */
	get name() { return this._name; }

	/**
	 * @property {string|string[]}
	 */
	get alias() { return this._alias || null; }
	set alias(v) { this._alias = v; }

	
	/**
	 * @property {boolean} Whether the command is implemented as a direction function call.
	 */
	get isDirect() { return this._instClass == null; }

	/**
	 * @property {boolean} Whether the command is linked to a context class.
	 */
	get isContext() { return this._instClass != null; }

	/**
	 * @property {Object} Object class to instantiate for every bot context.
	 */
	get instClass() { return this._instClass; }
	set instClass(v) { this._instClass =v;}

	/**
	 * @property {string} name of module that the command belongs to.
	 */
	get module(){
		return this._module || this._instClass ? this._instClass.constructor.name : 'unknown';
	}
	set module(v) { this._module = v;}

	/**
	 * @property {function}
	 */
	get func() { return this._func };
	set func(v) { this._func =v; }

	/**
	 * @property {string} Detailed command usage information.
	 */
	get usage() { return this._usage || this.desc; }
	set usage(v) { this._usage = v; }

	/**
	 * @property {string} short description of command.
	 */
	get desc() { return this._desc || 'Unknown'; }
	set desc(v) { this._desc=v;}

	/**
	 * @property {string} The way command line words are grouped into commmand arguments.
	 * Valid options are 'left' or 'right'.
	 */
	get group() { return this._group || null; }
	set group(v) { this._group = v;}

	/**
	 * @property {boolean} Hidden commands are not displayed in the help list.
	 */
	get hidden() { return this._hidden || false; }
	set hidden(v) { this._hidden = v;}

	/**
	 * @property 
	 */
	get args() { return this._args || null; }
	set args(v) { this._args = v;}

	/**
	 * @property {number} minimum arguments which must be supplied with the command.
	 */
	get minArgs() { return this._minArgs || 0; }
	set minArgs(v) { this._minArgs = v;}

	/**
	 * @property {number} maximum number of arguments that can be supplied to the command.
	 */
	get maxArgs() { return this._maxArgs || null; }
	set maxArgs(v) {this._maxArgs = v;}

	/**
	 * @property {number} Default permissions required to use this command.
	 * Can be overridden by BotContext Access.
	 */
	get access() { return this._access; }
	set access(v) { this._access = v;}

	/**
	 * @property {boolean} - immutable commands cannot have their access level changed.
	 */
	get immutable() { return this._immutable; }
	set immutable(v) { this._immutable = v; }

	/**
	 * 
	 * @param {string} name 
	 * @param {function} func 
	 * @param {Object} [opts=null] 
	 */
	constructor( name, func, opts=null ) {

		this._name = name;
		this._func = func;

		if ( opts ) Object.assign( this, opts );

	}

	/**
	 * 
	 * @param {string} cmd
	 * @returns {boolean}
	 */
	isMatch( cmd ) {

		if ( this._name === cmd ) return true;
		if ( !this._alias ) return false;

		if ( typeof( this._alias) === 'string') return cmd === this._alias;
		return this._alias.includes( cmd );

	}

}