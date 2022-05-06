let classes: CharClass[];
let classByName: { [name: string]: CharClass };

export default class CharClass {

	static GetClass(classname?: string) {

		return classname ? classByName[classname.toLowerCase()] : undefined;

	}

	static RandClass(classname?: string) {

		if (classname) {
			classname = classname.toLowerCase();
			if (classByName.hasOwnProperty(classname)) return classByName[classname];
		}
		return classes[Math.floor(classes.length * Math.random())];

	}

	get talents() { return this._talents; }

	get desc() { return this._desc; }
	get baseMods() { return this._baseMods; }
	get infoMods() { return this._infoMods; }
	get ver() { return this._ver; }
	get HD() { return this._hitdice; }
	get name() { return this._name; }
	get expMod() { return this._expMod ?? 1; }


	private _talents: string[] = [];
	private _desc: string;
	private _baseMods: any;
	private _infoMods: any;
	private _ver?: number;
	private _hitdice: string;
	private _name: string;
	private _expMod: number = 1;

	constructor() {
	}

	static FromJSON(json: any) {

		let o = new CharClass();

		if (json.hasOwnProperty('name')) o._name = json.name;

		if (json.hasOwnProperty('hitdice')) {
			o._hitdice = json.hitdice;
		}
		if (json.hasOwnProperty('baseMods')) o._baseMods = json.baseMods;

		if (json.talents) o._talents = json.talents;

		o._desc = json.desc;

		if (json.exp) o._expMod = json.exp;

		if (json.hasOwnProperty('infoMods')) {
			o._infoMods = json.infoMods;
		}
		return o;

	}

	hasTalent(t: string) {
		return this._talents && this._talents.includes(t);
	}

}
initClasses();
function initClasses() {

	classByName = {};
	classes = [];

	try {

		let a = require('./data/classes.json');

		let classObj, charclass;
		for (let i = a.length - 1; i >= 0; i--) {

			classObj = a[i];
			charclass = CharClass.FromJSON(classObj);
			classByName[charclass.name] = charclass;
			classes.push(charclass);

		}

	} catch (e) {
		console.log(e);
	}

}