var classes, classByName;

let CharClass = module.exports = class {

	static GetClass( classname ) {

		if ( classname ) return classByName[classname.toLowerCase()];
		return null;
	
	}

	static RandClass( classname ) {

		if ( classname ) {
			classname = classname.toLowerCase();
			if ( classByName.hasOwnProperty(classname) ) return classByName[classname];
		}
		return classes[ Math.floor(classes.length*Math.random()) ];
	
	}

	constructor() {
	}

	static FromJSON( json ) {

		let o = new CharClass();

		if ( json.hasOwnProperty('name')) o._name = json.name;

		if ( json.hasOwnProperty('hitdice')) {
			o._hitdice = json.hitdice;
		}
		if ( json.hasOwnProperty('baseMods'))o._baseMods = json.baseMods;

		if ( json.talents ) o._talents = json.talents;

		o._desc = json.desc;

		if ( json.exp) o._expMod = json.exp;

		if ( json.hasOwnProperty('infoMods')) {
			o._infoMods = json.infoMods;
		}
		return o;

	}

	hasTalent(t) {
		return this._talents && this._talents.includes(t);
	}

	get talents() { return this._talents; }

	get desc() { return this._desc; }
	get baseMods() { return this._baseMods; }
	get infoMods() { return this._infoMods; } 
	get ver(){ return this._ver; }
	get HD() { return this._hitdice; }
	get name() { return this._name; }
	get expMod() { return this._expMod || 1; }


}
initClasses();
function initClasses() {

	classByName = {};
	classes = [];

	try {

		let a = require( './data/classes.json');

		let classObj, charclass;
		for( let i = a.length-1; i>= 0; i-- ) {

			classObj = a[i];
			charclass = CharClass.FromJSON( classObj );
			classByName[ charclass.name ] = charclass;
			classes.push( charclass );

		}

	} catch (e){
		console.log(e);
	}

}