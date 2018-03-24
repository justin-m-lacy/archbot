class Spell {

	get name() { return this._name; }
	get duration() { return this._duration; }

	// 'single', 'allies', 'enemies', 'all', 'self'
	get target() { return this._target; }
	get damage() { return this._damage; }

	get mods() { return this._mods; }

	constructor() {
	}

	applyTo( char ) {
	}

}