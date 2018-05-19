const itemjs = require( './item.js');
const gender = require( '../social/gender.js');

module.exports = class Grave extends itemjs.Item {

	/**
	 * 
	 * @param {Char} char 
	 * @param {Char} killer 
	 */
	static MakeGrave( char, killer ) {
		return new Grave( char.name, killer.name, Grave.GetEpitaph( char, killer ) );
	}

	static FromJSON( json ) {

		let p = new Grave( json.char, json.killer, json.epitaph );

		itemjs.Item.FromJSON( json, p );

		return p;

	}

	static GetEpitaph( char, killer ) {

		let eps = this._Epitaphs || ( this._Epitaphs = require('../data/items/epitaphs.json'));
		let ep = eps[ Math.floor(Math.random()*eps.length) ];

		return gender.genderfy( char.sex, ep.replace( /%c/g, char.name ).replace( /%k/g, killer.name ) );

	}

	toJSON() {

		let s = super.toJSON();

		s.char = this.char;
		s.epitaph = this.epitaph;
		s.killer = this.killer;

		return s;

	}

	get char(){ return this._char;}
	set char(v) { this._char =v;}

	get epitaph() { return this._epitaph; }
	set epitaph(v) { this._epitaph = v; }

	get killer() { return this._killer; }
	set killer(v) { this._killer = v; }

	constructor( char, killer, epitaph ) {

		super( `${char}'s Gravestone`, `Here lies ${char}, slain by ${killer}.`, 'grave');

		this.char = char;
		this.killer = killer;
		this.epitaph = epitaph;
		
	}

	getDetails( imgTag=true) {
		return super.getDetails() + '\n' + this.epitaph;
	}

	/**
	 * @returns detailed string description of item.
	*/
	/*getDetails( imgTag=true ) {

		let s = this._name;
		if ( this._desc ) s += ': ' + this._desc;
		if ( this._inscript ) s += ' { ' + this._inscript + ' }';
		if ( this._attach && imgTag ) s += ' [img]';
		if ( this._crafter ) s += '\ncreated by ' + this._crafter;

		return s;
	}*/

}