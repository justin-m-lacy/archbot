module.exports = class {

	constructor( name, hitdice, statMods={} ) {

		this._name = name;
		this._hitdice = hitdice;
		this._statMods = statMods;

	}

	get HD() { return this._hitdice; }
	get name() { return this._name; }
	get statMods() { return this._statMods; }

}