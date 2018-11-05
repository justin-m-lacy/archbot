module.exports = class Setting {

	/**
	 * {Number} Permissions required for a user to use this setting.
	 */
	get permissions() {
		return this._permissions;
	}
	set permissions(v) { this._permissions = v; }
	constructor( vars =null) {

		if ( vars ) Object.assign( this, vars );

	}

}