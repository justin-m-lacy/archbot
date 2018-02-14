const infoProps = [ 'sex', 'age', 'height', 'weight' ];

exports.Char = class {

	get hp() { return this._hp; }
	set hp( v) { this._hp = v; }

	get name() { return this._name;}
	set name( v ) { this._name = v; }

	get charClass() { return this._charclass; }
	get race() { return this._race; }

	get level() { return this._level; }
	set level( n ) { this._level = n; }

	constructor( name, race, charclass, info) {

		this._name = name;
		this._race = race;
		this._charclass = charclass;
		this._level = 1;

		this._hp = 0;

		this._info = {};
		readinfo( info );

	}

	readinfo( info ) {

		let local = this._info;
		let prop;
		for( let i = infoProps.length-1; i>= 0; i--){

			prop = infoProps[i];
			if ( info.hasOwnProperty(prop)) {
				local[prop] = info[prop];
			}
		}

	}

}