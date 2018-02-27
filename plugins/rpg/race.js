class Race {

	static Create( name, hitdice, statMods={} ){

		let r = new Race();
		r._name = name;
		r._hitdice = hitdice;
		r._statMods = statMods;
		r._createMods = {};

		return r;

	}

	static FromJSON( json ) {

		let o = new Race();

		o._ver = json.ver != null ? json.ver : 1;

		if ( json.hasOwnProperty('name')){
			o._name = json.name;
		}
		if ( json.hasOwnProperty('hitdice')){
			o._hitdice = json.hitdice;
		}

		// mod stats added to base. recomputed on load
		// to allow for changes.
		if ( json.hasOwnProperty('baseMods')){
			o._baseMods = json.baseMods;
		}

		// absolute stats set once. gold, age, height, etc.
		if ( json.hasOwnProperty('infoMods')) {
			o._infoMods = json.infoMods;
		}
		return o;

	}

	constructor() {
	}

	get infoMods() { return this._infoMods; }
	get ver(){ return this._ver; }
	get HD() { return this._hitdice; }
	get name() { return this._name; }
	get baseMods() { return this._baseMods; }

}
module.exports = Race;