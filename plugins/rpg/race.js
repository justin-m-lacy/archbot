var races, raceByName;


class Race {

	static GetRace( racename ) {
		if ( racename == null || !raceByName.hasOwnProperty(racename) ) return races[ Math.floor(races.length*Math.random())];
		return raceByName[racename.toLowerCase()];
	}

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
initRaces();
function initRaces() {

	raceByName = {};
	races = [];

	try {

		let a = require( './data/races.json');

		let raceObj, race;
		for( let i = a.length-1; i>= 0; i-- ) {

			raceObj = a[i];
			race = Race.FromJSON( raceObj );
			raceByName[ race.name ] = race;
			races.push( race );

		}

	} catch (e){
		console.log(e);
	}

}

module.exports = Race;