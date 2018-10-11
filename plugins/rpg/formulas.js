const dice = require( './dice.js');

exports.DamageSrc = class DamageSrc {

	static FromString( dmg, type ) {
		return new DamageSrc( dice.Roller.FromString(dmg), type );
	}

	static FromJSON( json ) {

		if ( typeof(json) === 'string') {
			return new DamageSrc( dice.Roller.FromString( json));
		} else {

			if ( json.dmg ) {
				return new DamageSrc( dice.Roller.FromString( json.dmg ), json.type );
			} else {
				console.log('err damge source');
				return new DamageSrc( new dice.Roller(json.count, json.sides, json.bonus), json.type );
			}

		}
	}

	toJSON() { return { dmg:this.roller.toString(), type:this.type }; }

	get bonus() { return this.roller.bonus; }
	set bonus(v) { this.roller.bonus = v;}
	get sides() { return this.roller.sides;}
	set sides(v) { this.roller.sides = v;}
	get count() { return this.roller.count; }
	set count(v) { this.roller.count = v;}

	constructor( roller, type=null ) {

		this.roller = roller;
		this.type = type || 'mystery';

	}

	toString() { return this.roller.toString() + ' ' + this.type; }

	roll() { return this.roller.roll(); }

}