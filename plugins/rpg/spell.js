class Spell {

	name() { return this._name; }
	duration() { return this._duration; }

	// 'single', 'allies', 'enemies', 'all', 'self'
	target() { return this._target; }
	damage() { return this._damage; }

	constructor() {
	}

	applyTo( char ) {
	}

}