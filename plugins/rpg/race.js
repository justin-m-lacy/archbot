class Race {

	static Create( name, hitdice, statMods={} ){

		let r = new Race();
		r._name = name;
		r._hitdice = hitdice;
		r._statMods = statMods;
		return r;

	}

	static FromJSON( json ) {

		let r = new Race();
		if ( json.hasOwnProperty('name')){
			r._name = json.name;
		}
		if ( json.hasOwnProperty('hitdice')){
			r._hitdice = json.hitdice;
		}
		if ( json.hasOwnProperty('statMods')){
			r._statMods = json.statMods;
		}
		return r;

	}

	constructor() {
	}

	get HD() { return this._hitdice; }
	get name() { return this._name; }
	get statMods() { return this._statMods; }

}
module.exports = Race;