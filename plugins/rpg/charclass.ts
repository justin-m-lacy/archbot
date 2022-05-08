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
	private _desc?: string;
	private _baseMods: any;
	private _infoMods: any;
	private _ver?: number;
	private _hitdice: number = 0;
	private _name: string;
	private _expMod: number = 1;

	constructor(json: any) {

		this._name = json.name ?? 'None';

		this._hitdice = json.hitdice ?? 1;

		if (json.hasOwnProperty('baseMods')) this._baseMods = json.baseMods;

		if (json.talents) this._talents = json.talents;

		this._desc = json.desc;

		if (json.exp) this._expMod = json.exp;

		if (json.hasOwnProperty('infoMods')) {
			this._infoMods = json.infoMods;
		}

	}

	hasTalent(t: string) {
		return this._talents.includes(t);
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
			charclass = new CharClass(classObj);
			classByName[charclass.name] = charclass;
			classes.push(charclass);

		}

	} catch (e) {
		console.log(e);
	}

}