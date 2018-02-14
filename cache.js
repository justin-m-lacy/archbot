exports.Cache = class {

	// loader fallback loads with (key)
	// saver stores with (key,value)
	constructor( max_entries, loader, saver ) {

		this.max_size = max_entries;
		this.loader = loader;
		this.saver = saver;

		this.dict = {};

	}

	async get( key ) {

		if ( this.dict.hasOwnProperty(key)){
			return this.dict[key];
		}
		if ( !this.loader ) return null;

		try {

			console.log( 'fetching from file.');
			let val = await this.loader( key );
			if ( val != null ) {
				this.dict[key] = val;
			}
			return val;

		} catch ( err ){
			console.log(err);
			return null;
		}

	}

	async store( key, value ) {

		this.dict[key] = value;
		try {
			if ( this.saver ) {
				await this.saver( key, value );
			}
		} catch ( err ){
			console.log(err);
		}

	}

	free( key ){
		delete this.dict[key];
	}

	has( key ) {
		return this.dict.hasOwnProperty(key);
	}


}