import Char from "../char/char";

const itemjs = require('./item.js');
const gender = require('../social/gender.js');

export default class Grave extends itemjs.Item {

	/**
	 *
	 * @param {Char} char
	 * @param {Char} slayer
	 */
	static MakeGrave(char: Char, slayer: Char) {
		return new Grave(char.name, slayer.name, Grave.GetEpitaph(char, slayer));
	}

	static FromJSON(json: any) {

		// @deprecated killer
		let p = new Grave(json.char, json.slayer, json.epitaph);

		itemjs.Item.FromJSON(json, p);

		return p;

	}

	static GetEpitaph(char: Char, killer: Char) {

		let eps = this._Epitaphs ?? (this._Epitaphs = require('../data/items/epitaphs.json'));
		let ep = eps[Math.floor(Math.random() * eps.length)];

		return gender.genderfy(char.sex, ep.replace(/%c/g, char.name).replace(/%k/g, killer.name));

	}

	toJSON() {

		let s = super.toJSON();

		s.char = this.char;
		s.epitaph = this.epitaph;
		s.slayer = this.slayer;

		return s;

	}

	get epitaph() { return this._epitaph; }
	set epitaph(v) { this._epitaph = v; }

	private readonly char: string;
	private readonly slayer: string;

	private _epitaph: string;

	constructor(char: Char | string, slayer: Char | string, epitaph: string) {

		super(`${char}'s Gravestone`, `Here lies ${char}, slain by ${slayer}.`, 'grave');

		this.char = typeof char === 'string' ? char : char.name;
		this.slayer = typeof slayer === 'string' ? slayer : slayer.name;
		this._epitaph = epitaph;

	}

	getDetails(imgTag = true) {
		return super.getDetails() + '\n' + this.epitaph;
	}

}