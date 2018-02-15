const infoProps = [ 'sex', 'age', 'height', 'weight' ];
const statTypes = [ 'str', 'dex', 'con', 'int', 'wis', 'chr'];

const dice = require( '../dice/dice.js' );

module.exports = class {

	get hp() { return this._hp; }
	set hp( v) { this._hp = v; }

	get name() { return this._name;}
	set name( v ) { this._name = v; }

	get charClass() { return this._charClass; }
	set charClass( c ) { this._charClass = c; }
	get race() { return this._race; }
	set race( r) { this._race =  r; }

	get level() { return this._level; }
	set level( n ) { this._level = n; }

	get str() { return this._str; }
	set str( n ) { this._str = n;}

	get stats() { return this._stats; }

	toJSON() {
		let json = { _name:this._name, _hp:this._hp, _stats:this._stats, _level:this._level };
		json.race = this._race.name;
		json.charClass = this._charClass.name;
		return json;
	}

	constructor() {
	}

	initJSON( json, racesObj, classesObj ) {

		this._name = json._name;
		this._hp = json._hp;
		this._stats = json._stats;
		this._level = json._level;

		for( let k in racesObj ){
			console.log( 'race: ' + k );
		}
		console.log( json.race );
		this._race = racesObj[ json.race ];
		this._charClass = classesObj[ json.charClass ];

	}

	rollNew( name, race, charclass, info ){

		this._name = name;
		this._race = race;
		this._charClass = charclass;
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

	computeHp() {
		this._hp = Math.floor( (this._race.HD + this._charClass.HD)/2) + this.getModifier('con');
		if ( this._hp < 1 ) this._hp = 1;
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