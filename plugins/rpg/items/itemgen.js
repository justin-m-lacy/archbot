const Weapon = require( './weapon.js' );
const Armor = require( './armor.js');
const Item = require( './item.js');
const Material = require( './material.js');

exports.fromJSON = fromJSON;
exports.genWeapon = genWeapon;
exports.genArmor = genArmor;
exports.genItem = genItem;
exports.randItem = randItem;

var baseWeapons = require( '../data/weapons.json');
var baseArmors = require( '../data/armors.json');
var armorBySlot;
var weaponByType;

initArmors();

Material.LoadMaterials();

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

		default:
			return Item.Item.FromJSON( json );
	}

	return null;

}

function genWeapon() {

	let mat = Material.Random();
	if ( mat === null ) console.log( 'material is null');

	console.log( 'weaps len: ' + baseWeapons.length );
	let tmp = baseWeapons[ Math.floor( baseWeapons.length*Math.random() )];

	if ( tmp == null) console.log( 'weapon template is null.');

	return Weapon.FromData(tmp, mat);

}

function genArmor( slot=null ) {

	let mat = Material.Random();
	if ( mat === null ) console.log( 'material is null');
	console.log( 'armors len: ' + baseArmors.length );

	let tmp = slot ? getRandSlot(slot) : baseArmors[ Math.floor( baseArmors.length*Math.random() )];

	if ( !tmp ) return;

	return Armor.FromData( tmp, mat );

}

function getRandSlot( slot ) {

	let list = armorBySlot[slot];
	if ( !list ) return null;
	return list[ Math.floor( list.length*Math.random() )];

}

function genItem() {
}

function randItem() {

	var items = require( '../data/items.json');

	let it = items[ Math.floor( items.length*Math.random() )];

	let item = new Item.Item( it.name, it.desc );

	return item;

}