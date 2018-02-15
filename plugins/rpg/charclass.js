let CharClass = module.exports = class {

	constructor() {
	}

	static FromJSON( json ) {

		let r = new CharClass();
		if ( json.hasOwnProperty('name')) {
			r._name = json.name;
		}
		if ( json.hasOwnProperty('hitdice')) {
			r._hitdice = json.hitdice;
		}
		return r;

	}

	get HD() { return this._hitdice; }
	get name() { return this._name; }

}