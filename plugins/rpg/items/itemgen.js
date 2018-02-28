const Weapon = require( './weapon.js' );
const Armor = require( './armor.js');
const Item = require( './item.js');
const Material = require( './material.js');

exports.genWeapon = genWeapon;
exports.genArmor = genArmor;
exports.genItem = genItem;
exports.randItem = randItem;

var baseWeapons;
var baseArmors;

function init() {

	Material.LoadMaterials();
	baseWeapons = require( './data/weapons.json');
	baseArmors = require( './data/armors.json');

}

function genWeapon() {

	let mat = Material.Random();
	let tmp = baseWeapons[ Math.floor( baseWeapons.length*Math.random() )];

	return new Weapon();

}

function genArmor() {

	let mat = Material.Random();
	let tmp = baseArmors[ Math.floor( baseArmors.length*Math.random() )];

	return new Armor();

}

function getItem() {
}

function randItem() {

	var items = require( '../data/items.json');

	let it = items[ Math.floor( items.length*Math.random() )];

	let item = new Item( it.name, null, it.desc );

	return item;

}