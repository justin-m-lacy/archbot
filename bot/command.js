module.exports = class Command {

	get name() { return this._name; }

	/**
	 * string or array of string.
	 */
	get alias() { return this._alias || null; }
	set alias(v) { this._alias = v; }

	// whether the cmd calls a function directly.
	get isDirect() { return this._instClass == null; }

	/**
	 * {Boolean} Whether the command is linked to a context class.
	 */
	get isContext() { return this._instClass != null; }

	get instClass() { return this._instClass; }
	set instClass(v) { this._instClass =v;}

	get func() { return this._func };
	set func(v) { this._func =v; }

	get usage() { return this._usage || 'Unknown.'; }
	set usage(v) { this._usage = v; }

	/**
	 * 'left' or 'right'
	 */
	get group() { return this._group || null; }
	set group(v) { this._group = v;}

	// hidden commands not displayed in help list.
	get hidden() { return this._hidden || false; }
	set hidden(v) { this._hidden = v;}

	get args() { return this._args || null; }
	set args(v) { this._args = v;}

	get minArgs() { return this._minArgs || 0; }
	set minArgs(v) { this._minArgs = v;}

	get maxArgs() { return this._maxArgs || null; }
	set maxArgs(v) {this._maxArgs = v;}

	/**
	 * {Number} Default permissions required to use this command.
	 * Overridden by BotContext Access.
	 */
	get access() { return this._access; }
	set access(v) { this._access = v;}

	/**
	 * {boolean} - immutable commands cannot have their access level changed.
	 */
	get immutable() { return this._immutable; }
	set immutable(v) { this._immutable = v; }

	constructor( name, func, opts=null ) {

		this._name = name;
		this._func = func;

		if ( opts ) Object.assign( this, opts );

	}

	isMatch( cmd ) {

		if ( this._name === cmd ) return true;
		if ( !this._alias ) return false;

		if ( typeof( this._alias) === 'string') return cmd === this._alias;
		return this._alias.includes( cmd );

	}

}