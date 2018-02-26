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
		if ( json.hasOwnProperty('statMods')){
			o._statMods = json.statMods;
		}

		// absolute stats set once. gold, age, height, etc.
		if ( json.hasOwnProperty('create')) {
			o._createMods = json.create;
		}
		return o;

	}

	constructor() {
	}

	get createMods() { return this._createMods; }
	get ver(){ return this._ver; }
	get HD() { return this._hitdice; }
	get name() { return this._name; }
	get statMods() { return this._statMods; }

}
module.exports = Race;