module.exports = class Actor {

	get hp() { return this._hp; }
	set hp( v) { this._hp = v; }

	get name() { return this._name;}
	set name( v ) { this._name = v; }

	get race() { return this._race; }
	set race( r) { this._race =  r; }

	get level() { return this._level; }
	set level( n ) { this._level = n; }

	get stats() { return this._stats; }

	get gold() { return this._gold; }
	set gold( g ) { this._gold = g; }

	get sex() { return this._sex; }
	set sex(s) { this._sex = s; }

	constructor() {
	}

	applyMods( mods ) {

		if ( mods == null ) return;

		let stats = this._stats;
		let mod;

		for( let k in mods ) {

			mod = mods[k];
			if ( typeof(mod) === 'string' ) {
				mod = dice.parseRoll(mod);
			}

			if ( stats.hasOwnProperty(k)) {

				stats[k] += mod;
				if ( stats[k] < 3 ) {
					stats[k] = 3;
				}

			}
			else this._stats[k] = mod;

		}

	}

} //cls