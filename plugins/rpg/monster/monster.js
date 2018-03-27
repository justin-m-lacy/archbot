const form = require( '../formulas.js');
const monsters;
const byLevel;

// vars that can be rolled.
const formVars = [ 'hp','armor','toHit','mp'];

function initMonsters() {

	monsters = require( '../data/npc/monster.json');
	byLevel = {};

	for( let k in monsters ) {

		var m = monsters[k];
		m[name] = k;

		let a = byLevel[ Math.floor(m.level)];
		if ( !a ) byLevel[ Math.floor(m.level)] = a = [];
		a.push( m );

	}


}

function create( data ) {

	let m = new Monster();

	for( let k in data ) {

		var v = data[k];
		if ( v instanceof form.Formula ) {
			m[k] = v.eval(m);
		}

	} //for

	return m;

}

module.exports = class Monster {

	static RandMonster( level ) {

		level = Math.floor(level);

		do {

			var a = byLevel[level];
			if ( a && a.length > 0 ) return a[ Math.floor( a.length*Math.random())].clone();

		} while ( level >= 0 );

	}

	static FromJSON( json ) {

		let m = new Monster();
		Object.assign( m, json );

		return m;

	}

	toJSON() {
		return {
			name:this._name,
			desc:this._desc,
			level:this._level,
			dmg:this._dmg,
			hp:this._hp,
			armor:this._armor,
			toHit:this._toHit
		}
	}

	get name() { return this._name; }
	set name( v ) { this._name = v; }
	get level() { return this._level; }
	set level( v ) { this._level = v; }
	get toHit() { return this._toHit; }
	set toHit(v ) { this._toHit = v;}

	get armor() { return this._armor; }
	set armor(v ) { this._armor = v;}

	get dmg() { return this._dmg; }
	set dmg( v ) { this._dmg = v; }
	get hp() { return this._hp; }
	set hp( v ) { this._hp = v; }
	get desc() { return this._desc; }
	set desc( v ) { this._desc = v; }

	constructor() {
	}

	hit( dmg, type ) {

		this._hp -= dmg;
		if ( this._hp <= 0 ) return true;
		return false;

	}

	clone() { return Object.assign( new Monster(), this ); }
	

}