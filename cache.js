exports.Cache = class {

	get cacheKey() { return this._cacheKey; }

	// loader fallback loads with (key)
	// saver stores with (key,value)
	constructor( loader, saver, checker, cacheKey = '' ) {

		this._cacheKey = cacheKey;

		this.loader = loader;
		this.checker = checker;
		this.saver = saver;

		this._dict = {};

	}

	makeSubCache( subkey ) {

		if ( subkey.charAt( subkey.length-1 ) != '/' ) subkey = subkey + '/';

		let cache = new exports.Cache(
			this.loader, this.saver, this.checker, this._cacheKey + '/' + subkey );

		this._dict[subkey] = cache;
		return cache;
	}

	async get( key ) {

		if ( this._dict.hasOwnProperty(key)){
			console.log( 'key found: ' + key );
			console.log( 'key val: ' + this._dict[key]);
			return this._dict[key];
		}
		if ( !this.loader ) return null;

		try {

			console.log( 'fetching from file.');
			let val = await this.loader( this._cacheKey + key );
			if ( val != null ) {
				this._dict[key] = val;
			}
			return val;

		} catch ( err ){
			console.log(err);
			return null;
		}

	}

	async store( key, value ) {

		console.log('writing key: ' + key );
		this._dict[key] = value;
		try {
			if ( this.saver ) {
				await this.saver( this._cacheKey + key, value );
			}
		} catch ( err ) {
			console.log(err);
		}

	}

	free( key ) {
		delete this._dict[key];
	}

	// checks if data exists in cache
	// or backing store.
	async exists( key ){

		if ( this._dict.hasOwnProperty(key)) return true;
		if ( this.checker ) {
			return await this.checker( this._cacheKey + key);
		}
		return false;

	}

	// checks if key item is cached.
	has( key ) {
		return this._dict.hasOwnProperty(key);
	}


}