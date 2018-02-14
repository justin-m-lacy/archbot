const infoProps = [ 'sex', 'age', 'height', 'weight' ];
const statTypes = [ 'str', 'dex', 'con', 'int', 'wis', 'chr'];

const dice = require( '../dice/dice.js' );

module.exports = class {

	get hp() { return this._hp; }
	set hp( v) { this._hp = v; }

	get name() { return this._name;}
	set name( v ) { this._name = v; }

	get charClass() { return this._charclass; }
	get race() { return this._race; }

	get level() { return this._level; }
	set level( n ) { this._level = n; }

	get str() { return this._str; }
	set str( n ) { this._str = n;}

	get stats() { return this._stats; }

	constructor( name, race, charclass, info) {

		this._name = name;
		this._race = race;
		this._charclass = charclass;
		this._level = 1;

		this._hp = 0;

		this._info = {};
		this._stats = {};

		this.readinfo( info );

		this.rollStats();
		this.applyRace();
		this.computeHp();

	}

	rollStats() {

		let numDice = 3;
		let sides = 6;

		let len = statTypes.length;
		for( let i = 0; i < len; i++) {

			let stat = statTypes[i];
			this._stats[ stat ] = dice.roll( numDice, sides );

		}

	}

	applyRace() {

		let mods = this._race.statMods;
		let stats = this._stats;
		for( let k in mods ) {

			if ( stats.hasOwnProperty(k)) {
				stats[k] += mods[k];
				if ( stats[k] < 3 ) {
					stats[k] = 3;
				}
			}
			else this._stats[k] = mods[k];

		}

	}

	getLongDesc() {

		let desc = 'level ' + this._level + ' ' + this._race.name + ' ' + this._charclass.name;
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

	computeHp() {
		this._hp = Math.floor( (this._race.HD + this._charclass.HD)/2) + this.getModifier('str');
	}

	getModifier( stat ) {

		if ( !this._stats.hasOwnProperty(stat) ) return 0;
		return Math.floor( ( this._stats[stat] - 10)/2 );

	}

	readinfo( info ) {

		if (info ==null) return;

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