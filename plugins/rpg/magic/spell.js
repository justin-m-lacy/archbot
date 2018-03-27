class Spell {

	get name() { return this._name; }
	get duration() { return this._duration; }

	// 'single', 'allies', 'enemies', 'all', 'self'
	get target() { return this._target; }
	get damage() { return this._damage; }

	get formula() { return this._formula; }

	get effects() { return this.effects; }

	get mods() { return this._mods; }

	constructor() {
	}

	cast( src, target ) {
	}

}