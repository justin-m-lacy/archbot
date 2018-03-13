class Item {

	constructor( key, data, dirty=true ) {

		this.key = key;

		let now = Date.now();
		this.lastAccess = now;

		this.dirty = dirty;
		if ( dirty ) {
			this.lastSave = 0;
		} else {
			this.lastSave = Date.now();
		}
		this.data = data;

	}

	markSaved() {
		this.lastSave = Date.now();
		this.dirty = false;
	}

}

exports.Cache = class {

	get cacheKey() { return this._cacheKey; }

	// loader fallback loads with (key)
	// saver stores with (key,value)
	constructor( loader, saver, checker, deleter, cacheKey = '' ) {

		this._cacheKey = cacheKey;

		this.loader = loader;
		this.saver = saver;
		this.checker = checker;
		this.deleter = deleter;

		this._dict = {};

	}

	/**
	 * 
	 * @param {string} subkey 
	 */
	makeSubCache( subkey ) {

		if ( subkey.charAt( subkey.length-1 ) != '/' ) subkey = subkey + '/';

		let cache = new exports.Cache(
			this.loader, this.saver, this.checker, this.deleter, this._cacheKey + '/' + subkey );

		this._dict[subkey] = cache;
		return cache;
	}

	/**
	 * Asynchronous operation. Attempts to find value in local cache,
	 * then tries to load from backing store if not found.
	 * @param {string} key 
	 */
	async fetch( key ) {

		let item = this._dict[key];
		if ( item ) {
			item.lastAccess = Date.now();
			return item.data;
		}
		if ( !this.loader ) return null;

		//console.log( 'fetching from file: ' + key );
		let val = await this.loader( this._cacheKey + key );
		if ( val != null ) {
			this._dict[key] = new Item(key, val, false );
		}
		return val;

	}

	/**
	 * Caches and attempts to store value to backing store.
	 * @param {string} key 
	 * @param {*} value 
	 */
	async store( key, value ) {

		//console.log('writing key: ' + key );
		let item = new Item(key, value);
		this._dict[key] = item;

		if ( this.saver ) {
			await this.saver( this._cacheKey + key, value );
			item.markSaved();
			
		}

	}

	/**
	 * Attempts to retrieve a value from the cache
	 * without checking backing store.
	 * @param {*} key 
	 */
	get( key ) {
		let it = this._dict[key];
		if ( it ) {
			it.lastAccess = Date.now();
			return it.data;
		}
		return null;
	}

	/**
	 * Cache a value without saving to backing store.
	 * Useful when doing interval backups.
	 * @param {string} key 
	 * @param {*} value 
	 */
	cache( key, value ) {

		//console.log('writing key: ' + key );
		this._dict[key] = new Item( key, value);

	}

	/**
	 * Deletes object from local cache and from
	 * the backing store.
	 * @param {string} key 
	 */
	async delete( key ) {

		delete this._dict[key];
		if ( this.deleter != null ) {
			try {
				 await this.deleter( this._cacheKey + key );
			} catch(e) {console.log(e);}
		}
	
	}

	/**
	 * backup any items that have not been saved
	 * for at least the given time span.
	 * @param {number} time - time in ms since last save.
	 */
	async backup( time=1000*60*2 ) {

		if ( this.saver == null ) return;

		let now = Date.now();

		let dict = this._dict;
		for( let k in dict ) {

			var item = dict[k];
			if ( item instanceof exports.Cache ) {

				item.backup( time );

			} else {

				try {
					if ( now - item.lastSave > time ) {
						await this.saver( this._cacheKey + item.key, item.data );
						item.lastSave = now;	// technically some time passed.
					}
				} catch ( e ) { console.log(e);}

			}

		} // for

	}

	/**
	 * Clear old entries in cache, first saving
	 * dirty entries to file.
	 * @param {number} time - Time in ms since last access,
	 * for a cached file to be purged.
	 */
	async cleanup( time=1000*60*5 ) {

		if ( this.saver == null ) return this._cleanNoSave(time);

		let now = Date.now();
		let dict = this._dict;

		for( let k in dict ) {

			var item = dict[k];
			if ( item instanceof exports.Cache ) {

				item.cleanup( time );

			} else if ( now - item.lastAccess > time ) {

				if ( item.dirty ) {

					try {						
						await this.saver( this._cacheKey + item.key, item.data );
						delete dict[k];
					} catch ( e ) { console.log(e);}

				} else delete dict[k];

			}

		} // for

	}

	/**
	 * 
	 * @param {number} time 
	 */
	_cleanNoSave( time ) {

		let now = Date.now();
		let dict = this._dict;

		for( let k in dict ) {

			var item = dict[k];
			if ( item instanceof exports.Cache ) {

				item._cleanNoSave( time );

			} else if ( now - item.lastAccess > time ) {
				delete dict[k];
			}

		} // for

	}

	/**
	 * Frees the local memory cache, but does not
	 * delete from backing store.
	 * @param {string} key 
	 */
	free( key ) {
		delete this._dict[key];
	}


	/**
	 * Checks if the keyed data exists in the cache
	 * or in the underlying backing store.
	 * @param {string} key 
	 */
	async exists( key ){

		if ( this._dict.hasOwnProperty(key)) return true;
		if ( this.checker ) {
			return await this.checker( this._cacheKey + key);
		}
		return false;

	}

	/**
	 * Checks if a data item is locally cached
	 * for the key. Does not check backing store.
	 * @param {string} key 
	 */
	has( key ) {
		return this._dict.hasOwnProperty(key);
	}


}