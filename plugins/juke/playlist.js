module.exports = class Playlist {

	get name() { return this._name; }
	set name(v) { this._name = v;}

	get loop() { return this._loop; }
	set loop(v) { this._loop = v; }

	get loopCount() { return this._loopCount; }
	set loopCount(v) { this._loopCount = v; }

	constructor() {
	}

}