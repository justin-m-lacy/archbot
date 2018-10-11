

module.exports = class SpellContext {

	get world() { return this._world; }
	set world(v) { this._world = v;}

	get game() { return this._game; }
	set game(v) { this._game = v; }

	constructor( game ) {

		this._game = game;
		this._world = game.world;

	}

	cast( spell ) {
	}

};