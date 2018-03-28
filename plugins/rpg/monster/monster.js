const form = require( '../formulas.js');
const dice = require( '../dice.js');

// monster template objects.
var templates, byLevel;

this.initTemplates();

function initTemplates() {

	let raw = require( '../data/npc/monster.json');
	templates = {};
	byLevel = {};

	for( let k = raw.length-1; k >= 0; k-- ) {

		var t = parseTemplate( raw[k] );

		templates[ t.name ] = t;

		let a = byLevel[ Math.floor(t.level)];
		if ( !a ) byLevel[ Math.floor(t.level)] = a = [];
		a.push( t );

	}

}

// var strings to parse.
const parseVars = [ 'hp','armor','toHit','mp'];
function parseTemplate( json ) {

	let t = Object.assign( {}, json );

	for( let i = parseVars.length-1; i>=0; i-- ) {

		var v = parseVars[i];
		var s = t[v];
		if ( typeof(s) !== 'string' || !isNaN(s) ) continue;

		t[v] = new dice.Roller.FromString( s );

	}
	t.dmg = new form.DamageSrc.FromJSON( t.dmg );

}

function create( template ) {

	let m = new Monster();

	for( let k in template ) {

		// roll data formulas into concrete numbers.
		var v = template[k];
		if ( v instanceof form.Formula ) {
			m[k] = v.eval(m);
		} else if ( v instanceof dice.Roller ) {
			m[k] = v.roll();
		} else m[k] = v;

	} //for

	return m;

}

module.exports = class Monster {

	static RandMonster( lvl ) {

		lvl = Math.floor(lvl);

		do {
			var a = byLevel[lvl];
			if ( a && a.length > 0 ) return create( a[ Math.floor( a.length*Math.random())] );

		} while ( lvl >= 0 );

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
			maxHp:this._maxHp,
			hp:this._curHp,
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

	get size(){ return this._size; }
	set size(v) { this._size = v;}

	get armor() { return this._armor; }
	set armor(v ) { this._armor = v;}

	get dmg() { return this._dmg; }
	set dmg( v ) { this._dmg = v; }

	get curHp() { return this._hp; }
	set curHp( v ) { this._hp = v; }
	get maxHp() { return this._maxHp;}
	set maxHp(v ) { this._maxHp = v;}

	set hp(v){ this._curHp = this._maxHp = v; }

	get desc() { return this._desc; }
	set desc( v ) { this._desc = v; }

	get weap() { return this._weap;}
	set weap(v) { this._weap = v; }

	get state() { return this._state; }
	set state(v) { this._state = v;}

	constructor() {}

	// combat & future compatibility.
	getModifier( stat ) { return 0; }

	hit( dmg, type ) {

		this._hp -= dmg;
		if ( this._hp <= 0 ) {
			this._state = 'dead';
			return true;
		}
		return false;

	}

	clone() { return Object.assign( new Monster(), this ); }
	

}