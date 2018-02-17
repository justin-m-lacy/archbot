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

	constructor() {
	}

}