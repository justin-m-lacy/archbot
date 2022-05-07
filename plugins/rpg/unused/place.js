export default class Place {

	get id() { return this._id; }
	set id(v) { this._id = v; }

	get name() { return this._name; }
	set name(v) { this._name = v; }

	get parent() { return this._parent; }
	set parent(v) { this._parent = v;}

	static FromJSON( json ) {
	}

	toJSON() {
	}

	constructor() {
	}


}