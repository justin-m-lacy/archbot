const form = require( '../formulas.js');
const dice = require( '../dice.js');
const Weapon = require( '../items/weapon.js');
const stats = require('../char/stats.js');

// var formulas to parse.
const parseVars = [ 'hp','armor','toHit','mp'];

// monster template objects.
var templates, byLevel;

initTemplates();

function initTemplates() {

	let raw = require( '../data/npc/monster.json');
	templates = {};
	byLevel = [];

	let a;
	let tot = 0;
	for( let k = raw.length-1; k >= 0; k-- ) {

		var t = parseTemplate( raw[k] );

		tot++;
		templates[ t.name ] = t;

		a = byLevel[ Math.floor(t.level)];
		if ( !a ) byLevel[ Math.floor(t.level)] = a = [];
		a.push( t );

	}

	for( let k = byLevel.length-1; k >= 0; k-- ) {
		a = byLevel[k];
		if ( a ) console.log('Level ' + k + ' monsters: ' + a.length );
	}
	console.log( 'total monsters: ' + tot );

}

function parseTemplate( json ) {

	let t = Object.assign( {}, json );

	for( let i = parseVars.length-1; i>=0; i-- ) {

		var v = parseVars[i];
		var s = t[v];
		if ( typeof(s) !== 'string' || !isNaN(s) ) continue;

		t[v] = dice.Roller.FromString( s );

	}
	if ( t.dmg ) { t.dmg = new form.DamageSrc.FromJSON( t.dmg ); }
	if ( t.weap ) {
		t.weap = Weapon.FromData(t.weap);
	}

	return t;

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

class Monster {

	static RandMonster( lvl ) {

		lvl = Math.floor(lvl);

		do {
			var a = byLevel[lvl];
			if ( a && a.length > 0 ) return create( a[ Math.floor( a.length*Math.random())] );

		} while ( --lvl >= 0 );

	}

	static FromJSON( json ) {

		let m = new Monster();
		Object.assign( m, json );

		if ( m.weap ) m.weap = Weapon.FromJSON( m.weap );
		if ( m.toHit ) m.toHit = Number( m.toHit );
		return m;

	}

	toJSON() {

		let json = {
			name:this._name,
			desc:this._desc,
			level:this._level,
			maxHp:this._maxHp,
			curHp:this._curHp,
			armor:this._armor,
			toHit:this._toHit,
			state:this._state
		};

		if ( this._evil ) json.evil = this._evil;
		if ( this._kind ) json.kind = this._kind;

		if ( this._dmg ) json.dmg = this._dmg;
		if ( this._weap ) json.weap = this._weap;

		return json;

	}

	get template() { return this._template; }
	set template(t) { this._template = t;}
	get name() { return this._name; }
	set name( v ) { this._name = v; }
	
	get level() { return this._level; }
	set level( v ) { this._level = v; }
	get toHit() { return this._toHit; }
	set toHit(v ) { this._toHit = v;}

	get evil() { return this._evil; }
	set evil(v) { this._evil = v; }

	get kind() { return this._kind; }
	set kind(v) { this._kind = v; }

	get size(){ return this._size; }
	set size(v) { this._size = v;}

	get armor() { return this._armor; }
	set armor(v ) { this._armor = v;}

	get dmg() { return this._dmg; }
	set dmg( v ) { this._dmg = v; }

	get attacks() {
		return this._attacks;
	}
	set attacks( v) {
		this._attacks = v;
	}

	get curHp() { return this._curHp; }
	set curHp( v ) { this._curHp = v; }
	get maxHp() { return this._maxHp;}
	set maxHp(v ) { this._maxHp = v;}

	set hp(v){ this._curHp = this._maxHp = v; }

	get desc() { return this._desc; }
	set desc( v ) { this._desc = v; }

	get weap() { return this._weap;}
	set weap(v) { this._weap = v; }

	get state() { return this._state; }
	set state(v) { this._state = v;}

	constructor() {
		this._toHit = 0;
		this._state = 'alive';
	}

	getDetails() {

		let kind = this._kind ? ` ${this._kind}` : '';
		return `level ${this._level} ${this._name} [${stats.getEvil(this._evil)}${kind}]\nhp:${this._curHp}/${this._maxHp} armor:${this._armor}\n${this._desc}`;

	}

	// combat & future compatibility.
	getModifier( stat ) { return 0; }
	addExp( exp ) { }
	updateState() { if ( this._curHp <= 0) this._state = 'dead';}
	// used in combat
	async getState() { return this._state; }

	getWeapons() { return this._weap; }
	getAttacks() { return this._attacks; }

	hit( dmg, type ) {

		this._curHp -= dmg;
		if ( this._curHp <= 0 ) {
			this._state = 'dead';
			console.log('creature dead.');
			return true;
		}
		return false;

	}

	clone() { return Object.assign( new Monster(), this ); }
	

}

module.exports = Monster;