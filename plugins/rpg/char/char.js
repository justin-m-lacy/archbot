const statTypes = [ 'str', 'dex', 'con', 'int', 'wis', 'cha'];
const saveProps = [ 'name', 'exp', 'owner', 'state', 'info', 'baseStats', 'effects',
					'loc', 'history', 'statPoints', 'spentPoints', 'guild', 'inv', 'talents' ];

const Loc = require( '../world/loc.js');
const Level = require( './level.js');

const Inv = require( '../inventory.js');
const actor = require( './actor.js');
const effects = require( '../magic/effects.js');
const Equip = require( './equip.js');
const Item = require( '../items/item.js');
const Race = require( '../race.js');
const Class = require( '../charclass.js');
const stats = require( './stats.js');
const Log = require( '../display.js').Log;

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

	getEquip() {return this._equip; }

	get home() { return this._home;}
	set home(v) { this._home = v;}

	get history() { return this._history; }
	set history(v) { this._history = v;}

	get statPoints() { return this._statPoints; }
	set statPoints(v) { this._statPoints = v; }

	get spentPoints() { return this._spentPoints; }
	set spentPoints(v) { this._spentPoints = v; }

	get skills() { return this._skills; }
	set skills(v) { this._skills = v; }

	get skillPts() { return this._skillPts; }
	set skillPts(v ) { this._skillPts = v; }

	get evil() { return this.baseStats.evil; }
	set evil(v) { this.baseStats.evil = v;}

	get talents() { return this._talents; }
	set talents(v) { this._talents = v; }

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

		json.equip = this._equip;

		json.race = this._race.name;
		json.charClass = this._charClass.name;

		return json;
	}

	static FromJSON( json ) {

		if ( !json ) return null;

		let char = new Char( Race.RandRace(json.race), Class.RandClass( json.charClass ) );

		char.name = json.name;
		char.exp = Math.floor(json.exp) || 0;
		char.evil = json.evil || 0;

		char.guild = json.guild;

		char.owner = json.owner;

		if ( json.talents ) char.talents = json.talents;
		if ( json.history ) Object.assign( char.history, json.history );
		if ( json.home) char._home = new Loc.Coord( json.home.x, json.home.y );

		if ( json.baseStats ) Object.assign( char._baseStats, json.baseStats );
		if ( json.info ) Object.assign( char._info, json.info );
		if ( json.loc ) Object.assign( char._loc, json.loc );

		if ( json.state) char.state = json.state;

		char.statPoints = json.statPoints || char._baseStats.level;
		char.spentPoints = json.spentPoints || 0;

		if ( json.inv ) Inv.FromJSON( json.inv, char._inv );

		char.setBaseStats( char._baseStats );

		// SET AFTER BASE STATS.
		if ( json.effects ) {
			let a = json.effects;
			for( let i = a.length-1; i>=0; i-- ) {
				char.addEffect( effects.CharEffect.FromJSON(a[i]) );
			}
		}

		if ( json.equip) char.setEquip( Equip.FromJSON( json.equip ) );

		return char;

	}

	constructor( race, charclass, owner ) {

		super( race );

		this._charClass = charclass;

		this._statPoints = 0;
		this._spentPoints = 0;

		this._inv = new Inv();
		this._equip = new Equip();

		this._history = { explored:0, crafted:0};

		this._log = new Log();

		this._exp = 0;
		this._owner = owner;

	}

	/**
	 * Add a single point to the given stat.
	 * @param {string} stat 
	 * @returns {string|bool} error message, or true.
	 */
	addStat( stat ) {

		stat = stat.toLowerCase();
		if ( statTypes.indexOf( stat ) < 0 ) return 'Stat not found.';
		if ( this._spentPoints >= this._statPoints ) return 'No stat points available.';

		this._baseStats[stat]++;
		this._curStats[stat]++;

		this._spentPoints++;

		return true;

	}

	hasTalent(t) {
		return (this._talents && this._talents.includes(t)) || this.charClass.hasTalent(t) || this.race.hasTalent(t);
	}

	addHistory( evt ) {
		let v = this._history[evt] || 0;
		this._history[evt] = v + 1;
	}

	levelUp() {

		super.levelUp();
		this._statPoints++;

	}

	addExp( amt ) {
		this.exp += amt;
		return Level.tryLevel(this);
	}

	/**
	 * Eat an item from inventory.
	 * @param {number|string|Item} what
	 * @returns {string} result message.
	 */
	eat( what ) {

		let item = this._inv.get( what );
		if ( !item ) return 'Item not found.';

		if ( item.type !== Item.FOOD ) return item.name + ' isn\'t food!';

		this._inv.take( item );

		let cook = require( '../data/cooking.json');
		this.addHistory( 'eat');

		let resp = cook.response[ Math.floor( cook.response.length*Math.random() )];

		let amt = this.heal( Math.floor( 5*Math.random()) + this.level );

		resp = `You eat the ${item.name}. ${resp}.`;
		if ( amt > 0 ) resp += ` ${amt} hp healed. ${this.curHp}/${this.maxHp} total.`;

		return resp;
	}

	/**
	 * 
	 * @param {Item|number|string} what - what to cook.
	 */
	cook( what ) {

		let item = this._inv.get( what );
		if ( !item ) return 'Item not found.';

		if ( item.type === Item.FOOD) return item.name + ' is already food.';

		this.addHistory( 'cook');
		Item.Item.Cook( item);
		return `${this.name} cooks '${item.name}'`;

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
			this._inv.take( item );
			if ( removed ) {
				this.removeEquip( removed );
				this._inv.add(removed);
			}

			return true;
	
		}
		return removed;

	}

	/**
	 * Removes any items matching the predicate and returns them.
	 * Removed items are not added to inventory.
	 * @param {function} p 
	 */
	removeWhere( p ) {
		return this.removeEquip( this._equip.removeWhere(p) );
	}

	unequip( slot ) {

		let removed = this._equip.removeSlot( slot );
		if ( !removed ) return;
	
		this.removeEquip(removed);
		this._inv.add( removed );

		return removed;

	}

	setEquip( e ) {

		this._equip = e;
		for( let it of e.items() ) {
			
			if ( it instanceof Array ) {
				it.forEach( it=>this.applyEquip(it) );
			}
			else this.applyEquip(it);

		}
		console.log( this.name + ' armor: ' + this.armor );

	}

	applyEquip(it) {
		if ( it.mods ) {
			it.mods.apply( this._curStats );
		}
		if ( it.armor ) {
			this._curStats.armor += it.armor;
			//console.log('adding armor: ' + it.armor);
		}
	}

	/**
	 * 
	 * @param {Item|Item[]} wot 
	 */
	removeEquip(wot) {

		if ( wot instanceof Array ) {

			let it;
			for( let i = wot.length-1; i >= 0; i-- ) {
				it = wot[i];
				if ( it.mods ) it.mods.remove( this._curStats );
				if ( it.armor ) this._curStats._armor -= it.armor;
			}

		} else if ( wot ) {
			if ( wot.mods ) { wot.mods.remove( this._curStats ); }
			console.log('removing armor: ' + wot.armor );
			if ( wot.armor ) this._curStats._armor -= wot.armor;
		}

	}

	/**
	 * Returns the item in the given equipment slot.
	 * @param {Item} slot 
	 */
	getEquip( slot ) { return this._equip.get(slot); }

	listEquip() { return this._equip.getList(); }

	/**
	 * Removes and returns a random item, or null.
	 */
	randItem() { return this._inv.randItem(); }

	/**
	 * Get an item from inventory without removing it.
	 * @param {number|string|Item} which 
	 */
	getItem( which, sub ) { return this._inv.get( which, sub ); }

	/**
	 * Add an item to inventory.
	 * @param {Item|Item[]} it 
	 */
	addItem( it ) { return this._inv.add( it ); }

	/**
	 * Remove an item from inventory and return it.
	 * @param {number|string|Item} which
	 * @returns {Item} Item removed or null. 
	 */
	takeItem( which, sub ) { return this._inv.take(which, sub); }

	takeRange( start, end ){ return this._inv.takeRange( start, end); }

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
		//if ( this._charClass.talents ) this.talents = this._charClass.talents.concat( this._talents );

		super.applyBaseMods( this._charClass.statMods );

	}

	getTalents() {

		let s = new Set( this._talents );
		if ( this.charClass.talents ) this.charClass.talents.forEach( (v)=>s.add(v) );
		if ( this.race.talents ) this.race.talents.forEach( (v)=>s.add(v) );

		if ( s.size === 0 ) return `${this.name} has no talents.`;

		let res = this.name + "'s Talents:";
		for( let t of s ) res += '\n' + t;

		return res;

	}

	getWeapons() { return this._equip.getWeapons(); }

	testDmg() {

		let weaps = this._equip.getWeapons();
		if ( weaps === null ) return 'No weapons equipped.';
		else if ( weaps instanceof Array ) {

			let res = '';
			for( let i = weaps.length-1; i >= 0; i-- ) {
				res += weaps[i].name + ' rolled: ' + weaps[i].roll() + '\n';
			}
			return res;

		} else return weaps.name + ' rolled: ' + weaps.roll();

	}

	getLongDesc() {

		let desc = `level ${this.level} ${stats.getEvil(this.evil)} ${this._race.name} ${this._charClass.name} [${this._state}]`;
		desc += `\nage: ${this.age} sex: ${this.sex} gold: ${this.gold} exp: ${this._exp}/ ${Level.nextExp(this)}`;
		desc += `\nhp: ${this.curHp}/${this.maxHp} armor: ${this.armor}\n`;
		desc += this.getStatString();

		if ( this.spentPoints < this.statPoints ) desc += '\n' + (this.statPoints-this.spentPoints) + ' stat points available.';

		return desc;

	}

	getStatString() {

		let str = '';
		let len = statTypes.length;

		let stat = statTypes[0];
		str += stat + ': ' + this._curStats[stat];

		for( let i = 1; i < len; i++) {

			stat = statTypes[i];
			str += '\n' + stat + ': ' + this._curStats[stat];

		}
		return str;

	}

	log( str) { this._log.log(str); }
	getLog() { return this._log.text;}
	output( str='') { return this._log.output(str); }

	clearLog() { this._log.clear(); }

	getHistory() {

		let resp = (this._history.explored || 0 ) + ' locations discovered.\n';
		resp += ( this._history.crafted || 0 ) + ' items crafted.\n';
		resp += ( this._history.slay || 0 ) + ' monsters slain.\n';
		resp += ( this._history.pk || 0 ) + ' players killed.\n';
		resp += ( this.history.stolen || 0 ) + ' items stolen.\n'
		resp += ( this._history.cook || 0 ) + ' objects cooked.\n';
		resp += ( this._history.inscribe || 0 ) + ' items inscribed.\n';
		resp += ( this._history.eat || 0 ) + ' things eaten.\n';
		resp += ( this._history.quaff || 0 ) + ' potions quaffed.\n';
		resp += ( this._history.brew || 0 ) + ' potions brewed.';

		return resp;

	}

}

module.exports = Char;