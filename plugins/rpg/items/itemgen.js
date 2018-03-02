const Weapon = require( './weapon.js' );
const Armor = require( './armor.js');
const Item = require( './item.js');
const Material = require( './material.js');

exports.fromJSON = fromJSON;
exports.genWeapon = genWeapon;
exports.genArmor = genArmor;
exports.genItem = genItem;
exports.randItem = randItem;

var baseWeapons;
var baseArmors;

Material.LoadMaterials();
baseWeapons = require( '../data/weapons.json');
baseArmors = require( '../data/armors.json');


/**
 * revive an item from JSON
*/
function fromJSON( json ) {

	if ( json == null) return null;

	switch ( json.type ) {
		case 'armor':
		return Armor.FromJSON( json );
		break;

		case 'weapon':
		return Weapon.FromJSON(json);
		break;

		default:
		// check type.
		let it = new Item.Item( json.name, json.desc, json.type );
		if ( json.inscript ) it._inscript = json.inscript;
		return it;

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

function genArmor() {

	let mat = Material.Random();
	if ( mat === null ) console.log( 'material is null');
	console.log( 'armors len: ' + baseArmors.length );

	let tmp = baseArmors[ Math.floor( baseArmors.length*Math.random() )];

	if ( tmp == null) console.log( 'armor template is null.');

	return Armor.FromData( tmp, mat );

}

function genItem() {
}

function randItem() {

	var items = require( '../data/items.json');

	let it = items[ Math.floor( items.length*Math.random() )];

	let item = new Item.Item( it.name, it.desc );

	return item;

}