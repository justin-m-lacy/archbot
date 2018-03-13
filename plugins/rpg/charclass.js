var classes, classByName;

let CharClass = module.exports = class {

	static GetClass( classname ) {
		if ( classname == null || !classByName.hasOwnProperty(classname) ) return classes[ Math.floor(classes.length*Math.random()) ];
		return classByName[classname.toLowerCase()];
	}

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
