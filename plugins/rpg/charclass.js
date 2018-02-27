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
		if ( json.hasOwnProperty('baseMods')){
			o._baseMods = json.baseMods;
		}

		if ( json.hasOwnProperty('infoMods')) {
			o._infoMods = json.infoMods;
		}
		return o;

	}

	get baseMods() { return this._baseMods; }
	get infoMods() { return this._infoMods; }
	get ver(){ return this._ver; }
	get HD() { return this._hitdice; }
	get name() { return this._name; }

}