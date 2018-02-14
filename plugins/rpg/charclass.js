module.exports = class {

	constructor( name, hitdice ) {

		this._name = name;
		this._hitdice = hitdice;

	}

	get HD() { return this._hitdice; }
	get name() { return this._name; }

}