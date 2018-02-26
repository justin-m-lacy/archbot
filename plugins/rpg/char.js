const infoProps = [ 'sex', 'age', 'height', 'weight' ];
const statTypes = [ 'str', 'dex', 'con', 'int', 'wis', 'cha'];
const saveProps = [ 'name', 'level', 'exp', 'gold', 'owner', 'info', 'baseStats' ];

const Actor = require( './actor.js');
const dice = require( './dice.js' );

class Char extends Actor {

	get charClass() { return this._charClass; }
	set charClass( c ) { this._charClass = c; }

	get owner() { return this._owner; }

	get exp() { return this._exp; }
	set exp( v ) { this._exp = v; }

	toJSON() {
	
		let json = {};
		for( let i = saveProps.length-1; i>=0; i-- ) {

			var p = saveProps[i];
			json[p] = this[p];

		}
		json.race = this._race.name;
		json.raceVer = this._race.ver;

		json.charClass = this._charClass.name;
		json.classVer = this._charClass.ver;

		return json;
	}

	static FromJSON( json, racesObj, classesObj ) {

		let char = new Char();

		let p;
		let priv;
		for( let i = saveProps.length-1; i>=0; i-- ) {

			p = saveProps[i];
			priv = '_' + p;
			if ( json.hasOwnProperty(p)) {
				char[priv] = json[p];
			} else if ( json.hasOwnProperty(priv)) {
				char[priv] = json[priv];
			}

		}

		char._race = racesObj[ json.race ];
		char._charClass = classesObj[ json.charClass ];

		char.computeHp();
		char.applyRace();
		char.applyClass();

		return char;

	}

	constructor( owner=null) {
		super();
		this._owner = owner;

	}

	/**
	 * reroll hp.
	*/
	rollHp() {

		let hd = this._charClass.hitdice;
		let hp = Math.floor( ( this._race.hitdice + hd)/2 );

		for( let i = this._level-1; i > 0; i-- ) {
			hp += Dice.roll( 1, hd );
		}

		this._baseStats.hp = hp;
		this.computeHp();

	}

	makeNew( name, race, charclass, info ){

		this._name = name;
		this._race = race;
		this._charClass = charclass;
		this._level = 1;

		this._hp = 0;
		this._exp = 0;

		this._info = {};

		console.log( 'new: ' + race.name + ' ' + charclass.name );

		this.applyRace();
		this.computeHp();

	}

	setBaseStats( base ) {

		super.setBaseStats( base );
		this.applyClass();

	}


	applyClass() {

		if ( this._charClass == null ) return;
		super.applyMods( this._charClass.statMods );

	}

	

	getLongDesc() {

		let desc = 'level ' + this._level + ' ' + this._race.name + ' ' + this._charClass.name;
		desc += '\nhp: ' + this._hp;
		desc += '\n' + this.getStatString();

		return desc;

	}

	isVowel( lt ) {
		return lt === 'a' || lt === 'e' || lt === 'i' || lt === 'o' || lt === 'u';
	}

	getStatString() {

		let str = '';
		let len = statTypes.length;

		if ( len == 0 ) return '';

		let stat = statTypes[0];
		str += stat + ': ' + this._stats[stat];

		for( let i = 1; i < len; i++) {

			stat = statTypes[i];
			str += '\n' + stat + ': ' + this._stats[stat];

		}
		return str;

	}

	readinfo( info ) {

		if (info == null) return;

		let local = this._info;
		let prop;
		for( let i = infoProps.length-1; i>= 0; i--){

			prop = infoProps[i];
			if ( info.hasOwnProperty(prop)) {
				local[prop] = info[prop];
			}
		}

	}

}

module.exports = Char;