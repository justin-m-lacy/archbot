var materials;
var byName;

// materials in lists by level.
var byLevel;

// arrays of materials by type, e.g. cloth, metal, etc.
//var byType;

module.exports = class Material {

	static Random( maxLevel=null ) {

		if ( !Number.isNaN( maxLevel) ) {

			let m, list;
			while ( maxLevel >= 0 ) {

				list = byLevel[maxLevel];
				console.log('getting level mat: ' + maxLevel )
				if ( list && list.length > 0 ) return list[ Math.floor( list.length*Math.random() )];
				console.log( maxLevel + ' material list is null');
				maxLevel--;

			}

			return null;

		}

		return materials[ Math.floor( materials.length*Math.random() ) ];

	}

	static GetMaterial( name ) {
		return byName[name];
	}

	static LoadMaterials() {

		if ( materials != null) return;

		try {

			const objs = require( '../data/materials.json');
			materials = [];
			byName = {};
			byLevel = {};

			for( let i = objs.length-1; i >= 0; i-- ) {

				var m = new Material();
				Object.assign( m, objs[i]);
				byName[m.name] = m;
				this.AddToLevel( m, m.level );

				materials.push( m );

			}

		} catch(e) {
			materials = []; console.log(e);
		}

	}

	static AddToLevel( mat, lvl=0 ) {

		if ( lvl === null ) lvl = 0;

		let list = byLevel[ lvl ];
		if ( !list ) {
			byLevel[lvl] = list = [];
		}

		list.push(mat);

	}

	constructor() {}

}