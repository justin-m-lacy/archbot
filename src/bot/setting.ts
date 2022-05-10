module.exports = class Setting {

	/**
	 * {number} Permissions required for a user to use this setting.
	 */
	get permissions() {
		return this._permissions;
	}
	set permissions(v) { this._permissions = v; }

	private _permissions: any;

	constructor(vars = null) {

		if (vars) Object.assign(this, vars);

	}

}