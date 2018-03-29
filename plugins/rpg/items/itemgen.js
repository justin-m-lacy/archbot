const Weapon = require( './weapon.js' );
const Armor = require( './armor.js');
const Item = require( './item.js');
const Material = require( './material.js');
const Feature = require( '../world/feature.js');

exports.fromJSON = fromJSON;
exports.genWeapon = genWeapon;
exports.genArmor = genArmor;
exports.genItem = genItem;
exports.genFeature = randFeature;
exports.genLoot = genLoot;

exports.randItem = randItem;

var featureByName;
var featureList;

var baseWeapons = require( '../data/weapons.json');
var baseArmors = require( '../data/armors.json');
var armorBySlot;
var weaponByType;

initFeatures();
initArmors();

Material.LoadMaterials();

/**
 * Create named feature from data.
 * @param {string} s 
 */
function getFeature( s ) {
	let d = featureByName[s];
	if ( d ) return Feature.FromJSON(d);
	return null;
}

function initFeatures() {

	console.log('INIT FEATURES');
	featureList = require( '../data/world/features.json');
	featureByName = {};

	for( let i = featureList.length-1; i>= 0; i-- ) {
		featureByName[ featureList[i].name ] = featureList[i]; 
	}
	console.log('INIT FEATURES DONE');

}

function initArmors() {

	armorBySlot = {};

	let armor, slot, list;
	for( let k = baseArmors.length-1; k >= 0; k-- ) {

		armor = baseArmors[k];
		slot = armor.slot;

		list = armorBySlot[slot];
		if ( !list ) list = armorBySlot[slot] = [];

		list.push( armor );

	}

}

/**
 * revive an item from JSON
*/
function fromJSON( json ) {

	if ( !json ) return null;

	switch ( json.type ) {
		case 'armor':
		return Armor.FromJSON( json );
		break;

		case 'weapon':
		return Weapon.FromJSON(json);
		break;

		case 'feature':
		return Feature.FromJSON(json);
		break;

		default:
			return Item.Item.FromJSON( json );
	}

	return null;

}

function genWeapon( lvl ) {

	let mat = Material.Random( lvl );
	if ( mat === null ) { console.log( 'material is null'); return null; }

	console.log( 'weaps len: ' + baseWeapons.length );
	let tmp = baseWeapons[ Math.floor( baseWeapons.length*Math.random() )];

	if ( tmp == null) console.log( 'weapon template is null.');

	return Weapon.FromData(tmp, mat);

}

function genArmor( slot=null, lvl=0 ) {
	
	console.log( 'armor level: ' + lvl );

	let mat = Material.Random( lvl );
	if ( mat === null ) { console.log( 'material is null'); return null; }

	let tmp;
	if ( slot ) {
		tmp = getSlotRand( slot, lvl );
	} else {
		let list = baseArmors.filter( t=>!t.level || t.level <= lvl );
		tmp = list[ Math.floor( list.length*Math.random() )];
	}

	if ( !tmp ) return;

	return Armor.FromData( tmp, mat );

}

function getSlotRand( slot,lvl=0) {

	let list = armorBySlot[slot];
	if ( !list ) return;
	list = list.filter( t=>!t.level || t.level <= lvl );
	return list[ Math.floor( list.length*Math.random() )];

}

function randFeature() {

	let data = featureList[ Math.floor(featureList.length*Math.random() )];
	return Feature.FromJSON( data );

}

function genItem() {
}

function genLoot( lvl ) {

	lvl = Math.floor(lvl);

	let loot = {};
	if ( Math.random() < 0.5 ) {
		// gold
		loot.gold = Math.floor( 20*lvl*Math.random()+0.1 );
	}
	if ( Math.random() < 0.2 ) {
		loot.items = [genArmor(null,lvl)];
	}
	if ( Math.random() < 0.1 ) {
		if ( !loot.items) loot.items =[];
		loot.items.push( genWeapon(lvl) );
	}

	return loot;

}

function randItem() {

	var items = require( '../data/items.json');

	let it = items[ Math.floor( items.length*Math.random() )];

	let item = new Item.Item( it.name, it.desc );

	return item;

}