let CharClass = module.exports = class {

	constructor() {
	}

	static FromJSON( json ) {

		let o = new CharClass();

		o._ver = json.ver != null ? json.ver : 1;

		if ( json.hasOwnProperty('name')) {
			o._name = json.name;
		}
		if ( json.hasOwnProperty('hitdice')) {
			o._hitdice = json.hitdice;
		}
		if ( json.hasOwnProperty('statMods')){
			o._statMods = json.statMods;
		}

		if ( json.hasOwnProperty('create')) {
			o._createMods = json.create;
		}
		return o;

	}

	
	get createMods() { return this._createMods; }
	get ver(){ return this._ver; }
	get HD() { return this._hitdice; }
	get name() { return this._name; }

}