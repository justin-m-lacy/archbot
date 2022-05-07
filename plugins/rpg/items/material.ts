let materials: Material[];
let byName: { [name: string]: Material };

// materials in lists by level.
let byLevel: { [level: number]: Material[] | undefined };

// arrays of materials by type, e.g. cloth, metal, etc.
//var byType;

export default class Material {

	static Random(maxLevel?: number) {

		if (maxLevel && !Number.isNaN(maxLevel)) {

			let list;
			while (maxLevel >= 0) {

				list = byLevel[maxLevel];
				console.log('getting level mat: ' + maxLevel)
				if (list && list.length > 0) return list[Math.floor(list.length * Math.random())];
				console.log(maxLevel + ' material list is null');
				maxLevel--;

			}

			return null;

		}

		return materials[Math.floor(materials.length * Math.random())];

	}

	static GetMaterial(name: string) {
		return byName[name];
	}

	static LoadMaterials() {

		if (materials != null) return;

		try {

			const objs = require('../data/items/materials.json');
			materials = [];
			byName = {};
			byLevel = {};

			for (let i = objs.length - 1; i >= 0; i--) {

				var m = new Material();
				Object.assign(m, objs[i]);
				byName[m.name] = m;
				this.AddToLevel(m, m.level);

				materials.push(m);

			}

		} catch (e) {
			materials = []; console.log(e);
		}

	}

	static AddToLevel(mat: Material, lvl: number = 0) {

		if (lvl === null) lvl = 0;

		let list = byLevel[lvl];
		if (!list) {
			byLevel[lvl] = list = [];
		}

		list.push(mat);

	}

	name!: string;
	level: number = 0;
	bonus?: number;
	priceMod?: number;

	constructor() { }

}