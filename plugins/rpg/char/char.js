const statTypes = [ 'str', 'dex', 'con', 'int', 'wis', 'cha'];
const saveProps = [ 'name', 'exp', 'owner', 'info', 'baseStats', 'loc' ];

const Inv = require( '../inventory.js');
const actor = require( './actor.js');
const dice = require( '../dice.js' );
const Equip = require( './equip.js');
const Item = require( '../items/item.js');

class Char extends actor.Actor {

	get charClass() { return this._charClass; }
	set charClass( c ) { this._charClass = c; }

	get owner() { return this._owner; }
	set owner( v ) { this._owner = v;}

	get id() { return this._id; }
	set id(v) { this._id = v; }

	get exp() { return this._exp; }
	set exp( v ) { this._exp = v; }

	get inv() { return this._inv; }
	set inv( v ) { this._inv = v; }

	get equip() { return this._equip; }
	set equip(v) { this._equip= v;}

	get home() { return this._home;}
	set home(v) { this._home = v;}

	toJSON() {
	
		let json = {};
		for( let i = saveProps.length-1; i>=0; i-- ) {

			var p = saveProps[i];
			json[p] = this[p];

		}

		if ( this._home ) json.home = this._home;

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

		char.name = json.name;
		char.exp = json.exp;
		char.owner = json.owner;

		if ( json.home) char._home = json.home;

		if ( json.baseStats ) Object.assign( char._baseStats, json.baseStats );
		if ( json.info ) Object.assign( char._info, json.info );
		if ( json.loc ) {
			Object.assign( char._loc, json.loc );
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

	addExp( amt ) {
		this._baseStats.exp += amt;
	}

	/**
	 * Returns the item in the given equipment slot.
	 * @param {Item} slot 
	 */
	getEquip( slot ) {

		return this._equip.get(slot);

	}

	/**
	 * Eat an item from inventory.
	 * @param {number|string|Item} what 
	 */
	eat( what ) {

		let item = this._inv.get( what );
		if ( item == null ) return 'Item not found.';

		if ( item.type != Item.FOOD ) return item.name + ' isn\'t food!';

		this._inv.remove( item );

		let cook = require( '../data/cooking.json');
		let resp = cook.response[ Math.floor( cook.response.length*Math.random() )];

		return 'You eat the ' + item.name + '. ' + resp + '.';

	}

	cook( what ) {

		let item = this._inv.get( what );
		if ( item == null ) return 'Item not found.';

		if ( item.type == Item.FOOD) return item.name + ' is already food.';

		Item.Item.Cook( item);
		return this.name + ' cooks \'' + item.name + '\'';

	}

	/**
	 * 
	 * @param {number|string|Item} what
	 * @returns {bool|string} Error message or true.
	 */
	equip( what ) {

		let item = this._inv.get( what );

		if ( item == null ) return 'No such item.';

		let removed = this._equip.equip(item);
		if ( typeof(removed) !== 'string') {

			this._inv.remove( item );
			if ( removed ) this._inv.add(removed);

			return true;
	
		}
		return removed;

	}

	unequipItem( it ) {

		let res = this._equip.remove(it);
		// TODO. temp code. temp error feedback.
		if ( res == it ) {
			this._inv.add( it );
		}

	}

	/**
	 * Get an item from inventory without removing it.
	 * @param {number|string|Item} whichItem 
	 */
	getItem( whichItem ) {
		return this._inv.get( whichItem);
	}

	/**
	 * Add an item to inventory.
	 * @param {Item} it 
	 */
	addItem( it ) {
		this._inv.add( it );
	}

	/**
	 * Remove an item from inventory and return it.
	 * @param {number|string|Item} which
	 * @returns {Item} Item removed or null. 
	 */
	takeItem( which ) {
		return this._inv.remove(which);
	}

	/**
	 * reroll hp.
	*/
	rollBaseHp() {

		let hd = this._charClass.HD;
		let maxHp = Math.floor( ( this._race.HD + hd)/2 );

		for( let i = this._baseStats.level-1; i > 0; i-- ) {
			maxHp += Dice.roll( 1, hd );
		}

		this._baseStats.maxHp = maxHp;

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

	testDmg() {

		let weaps = this._equip.getWeapons();
		if ( weaps === null ) return 'No weapons equipped.';
		else if ( weaps instanceof Array ) {

			let res = '';
			for( let i = weaps.length-1; i >= 0; i-- ) {
				res += weaps[i].name + ' rolled: ' + weaps[i].roll() + '\n';
			}
			return res;

		} else {
			return weaps.name + ' rolled: ' + weaps.roll();
		}

	}

	getLongDesc() {

		let desc = 'level ' + this.level + ' ' + this._race.name + ' ' + this._charClass.name;
		desc += '\nage: ' + this.age + '\t sex: ' + this.sex + '\t gold: ' + this.gold;
		desc += '\nhp: ' + this.curHp + '/' + this.maxHp;
		desc += '\n' + this.getStatString();

		return desc;

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