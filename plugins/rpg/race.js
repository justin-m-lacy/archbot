var races, raceByName;


class Race {

	static GetRace( racename ) {

		if ( racename ) {
			racename = racename.toLowerCase();
			if ( raceByName.hasOwnProperty(racename)) return raceByName[racename];
		}
		return races[ Math.floor(races.length*Math.random())];
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

		o._ver = json.ver || 1;

		if ( json.hasOwnProperty('name')){
			o._name = json.name;
		}
		if ( json.hasOwnProperty('hitdice')){
			o._hitdice = json.hitdice;
		}

		if ( json.exp ) o._expMod = json.exp;

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
	get expMod() { return this._expMod || 1; }

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