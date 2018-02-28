var materials;
var byName;

module.exports = class Material {

	static Random() {
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

			for( let i = objs.length-1; i >= 0; i-- ) {

				var m = new Material();
				Object.assign( m, objs[i]);
				byName[m.name] = m;
				materials.push( m );

			}

		} catch(e) {
			materials = []; console.log(e);
		}

	}

	constructor(){
	}

}