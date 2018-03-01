const infoProps = [ 'sex', 'age', 'height', 'weight' ];
const statTypes = [ 'str', 'dex', 'con', 'int', 'wis', 'cha'];
const saveProps = [ 'name', 'exp', 'owner', 'info', 'baseStats' ];

const Inv = require( './inventory.js');
const Actor = require( './actor.js');
const dice = require( './dice.js' );
const Equip = require( './equip.js');

class Char extends Actor {

	get charClass() { return this._charClass; }
	set charClass( c ) { this._charClass = c; }

	get owner() { return this._owner; }

	get exp() { return this._exp; }
	set exp( v ) { this._exp = v; }

	get inv() { return this._inv; }
	set inv( v ) { this._inv = v; }

	get equip() { return this._equip; }
	set equip(v) { this._equip= v;}

	toJSON() {
	
		let json = {};
		for( let i = saveProps.length-1; i>=0; i-- ) {

			var p = saveProps[i];
			json[p] = this[p];

		}

		json.inv = this._inv;
		json.equip = this._equip;

		json.race = this._race.name;
		json.raceVer = this._race.ver;

		json.charClass = this._charClass.name;
		json.classVer = this._charClass.ver;

		return json;
	}

	static FromJSON( json, racesObj, classesObj ) {

		if ( json == null ) return null;

		let char = new Char( racesObj[ json.race ], classesObj[ json.charClass ] );

		let p;
		let priv;
		for( let i = saveProps.length-1; i>=0; i-- ) {

			p = saveProps[i];
			priv = '_' + p;
			if ( json.hasOwnProperty(p)) {
				char[priv] = json[p];
			}

		}

		if ( json.inv ) char._inv = Inv.FromJSON( json.inv );
		if ( json.equip) char._equip = Equip.FromJSON( json.equip );

		char.setBaseStats( char._baseStats );

		return char;

	}

	constructor( race, charclass, owner ) {

		super( race );

		this._charClass = charclass;

		this._inv = new Inv();
		this._equip = new Equip();

		this._owner = owner;

	}

	listEquip() {
		return this._equip.getList();
	}

	unequip( slot ) {

		let item = this._equip.removeSlot( slot );
		if ( item == null ) return false;
		this._inv.add( item );

		return true;

	}

	equip( what ) {

		let item = this._inv.remove( what );

		if ( item == null ) return false;

		let removed = this._equip.equip(item);
		if ( removed != null ) this._inv.add(removed);

		return true;

	}

	unequipItem( it ) {

		let res = this._equip.remove(it);
		// TODO. temp code. temp error feedback.
		if ( res == it ) {
			this._inv.add( it );
		}

	}

	getItem( whichItem ) {
		return this._inv.get( whichItem);
	}

	addItem( it ) {
		this._inv.add( it );
	}

	takeItem( which ) {
		return this._inv.remove(which);
	}

	/**
	 * reroll hp.
	*/
	rollBaseHp() {

		let hd = this._charClass.HD;
		let hp = Math.floor( ( this._race.HD + hd)/2 );

		for( let i = this._baseStats.level-1; i > 0; i-- ) {
			hp += Dice.roll( 1, hd );
		}

		this._baseStats.hp = hp;

	}

	setBaseStats( base ) {

		super.setBaseStats( base );
		this.applyClass();
		this.computeHp();

	}


	applyClass() {

		if ( this._charClass == null ) return;
		super.applyMods( this._charClass.statMods );

	}

	getLongDesc() {

		let desc = 'level ' + this.level + ' ' + this._race.name + ' ' + this._charClass.name;
		desc += '\nage: ' + this.age + ' sex: ' + this.sex + ' gold: ' + this.gold;
		desc += '\nhp: ' + this.hp;
		desc += '\n' + this.getStatString();

		return desc;

	}

	isVowel( lt ) {
		return lt === 'a' || lt === 'e' || lt === 'i' || lt === 'o' || lt === 'u';
	}

	getStatString() {

		let str = '';
		let len = statTypes.length;

		if ( len === 0 ) return '';

		let stat = statTypes[0];
		str += stat + ': ' + this._curStats[stat];

		for( let i = 1; i < len; i++) {

			stat = statTypes[i];
			str += '\n' + stat + ': ' + this._curStats[stat];

		}
		return str;

	}

}

module.exports = Char;