exports.CharClass = class {

	constructor( name, hitdice ) {

		this.name = name;
		this.hitdice = hitdice;

	}

	get HD() { return this.hitdice; }
	get name() { return this.name; }

}