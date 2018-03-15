const statTypes = [ 'str', 'dex', 'con', 'int', 'wis', 'cha'];
const saveProps = [ 'name', 'exp', 'owner', 'info', 'baseStats', 'loc', 'history' ];

const Level = require( './level.js');

const Inv = require( '../inventory.js');
const actor = require( './actor.js');
const dice = require( '../dice.js' );
const Equip = require( './equip.js');
const Item = require( '../items/item.js');
const Race = require( '../race.js');
const Class = require( '../charclass.js');

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

	get home() { return this._home;}
	set home(v) { this._home = v;}

	/**
	 * number of locations explored.
	 */
	get explored() { return this._history.explored; }
	set explored(v) { this._history.explored = v;}

	get crafted() { return this._history.crafted;}
	set crafted(v) { this._history.crafted = v; }

	get history() { return this._history; }
	set history(v) { this._history = v;}

	
	/**
	 * Notification for level up.
	 * TODO: replace with event system.
	 */
	get levelFlag() { return this._levelUp; }
	set levelFlag(b) { this._levelUp = b;}

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

	static FromJSON( json ) {

		if ( json == null ) return null;

		let char = new Char( Race.GetRace(json.race), Class.GetClass( json.charClass ) );

		char.name = json.name;
		char.exp = json.exp || 0;
		char.owner = json.owner;

		if (json.history ) Object.assign( char.history, json.history );
		if ( json.home) char._home = json.home;

		if ( json.baseStats ) Object.assign( char._baseStats, json.baseStats );
		if ( json.info ) Object.assign( char._info, json.info );
		if ( json.loc ) {
			Object.assign( char._loc, json.loc );
		}


		if ( json.inv ) char._inv = Inv.FromJSON( json.inv );

		char.setBaseStats( char._baseStats );

		if ( json.equip) char.setEquip( Equip.FromJSON( json.equip ) );

		return char;

	}

	constructor( race, charclass, owner ) {

		super( race );

		this._charClass = charclass;

		this._inv = new Inv();
		this._equip = new Equip();

		this._history = { explored:0, crafted:0};

		this._exp = 0;
		this._owner = owner;

	}

	addCrafted() {
		this._history.crafted++;
	}
	addExplored() {
		this._history.explored++;
	}

	addExp( amt ) {
		this.exp += amt;
		return Level.tryLevel(this);
	}

	/**
	 * Eat an item from inventory.
	 * @param {number|string|Item} what 
	 */
	eat( what ) {

		let item = this._inv.get( what );
		if ( !item ) return 'Item not found.';

		if ( item.type !== Item.FOOD ) return item.name + ' isn\'t food!';

		this._inv.remove( item );

		let cook = require( '../data/cooking.json');
		let resp = cook.response[ Math.floor( cook.response.length*Math.random() )];

		return 'You eat the ' + item.name + '. ' + resp + '.';

	}

	cook( what ) {

		let item = this._inv.get( what );
		if ( !item ) return 'Item not found.';

		if ( item.type === Item.FOOD) return item.name + ' is already food.';

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

		if ( !item ) return 'No such item.';

		let removed = this._equip.equip(item);
		if ( typeof(removed) !== 'string') {

			this.applyEquip(item);
			this._inv.remove( item );
			if ( removed ) this._inv.add(removed);

			return true;
	
		}
		return removed;

	}

	unequip( slot ) {

		let item = this._equip.removeSlot( slot );
		if ( !item ) return false;

		this.removeEquip(item);

		this._inv.add( item );

		return true;

	}

	setEquip( e ) {

		this._equip = e;
		for( let it in e.items ) {
			this.applyEquip(it);
		}

	}

	applyEquip(it) {
		if ( it.mods ) {
			it.mods.apply( this._curStats );
		}
		if ( it.armor ) this._curStats.armor += it.armor;
	}
	removeEquip(it) {
		if ( it.mods ) {
			it.mods.remove( this._curStats );
		}
		if ( it.armor ) this._curStats.armor -= it.armor;
	}

	/**
	 * Returns the item in the given equipment slot.
	 * @param {Item} slot 
	 */
	getEquip( slot ) {
		return this._equip.get(slot);
	}

	listEquip() {
		return this._equip.getList();
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

		if ( !this._charClass ) return;
		super.applyBaseMods( this._charClass.statMods );

	}

	rollDmg() {

		let weaps = this._equip.getWeapons();
		if ( weaps === null ) return dice.roll(1,2);
		else if ( weaps instanceof Array ) {

			return weaps[Math.floor(weaps.length*Math.random() )].roll();

		} else {
			return weaps.roll();
		}

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
		desc += '\nage: ' + this.age + '\t sex: ' + this.sex + '\t gold: ' + this.gold + '\t exp: ' + this._exp;
		desc += '\nhp: ' + this.curHp + '/' + this.maxHp + '\t armor: ' + this.armor;
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