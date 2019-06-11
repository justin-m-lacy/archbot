exports.randElm = (arr)=>{
	const ind = Math.floor( Math.random()*(arr.length));
	return arr[ind];
}

/**
 * Returns a random between [min,max]
 * @param {number} min
 * @param {number} max
 */
exports.random = (min, max)=>{
	return min + Math.round( Math.random()*(max-min) );
}

/**
 * Quickly removes an element from an array but does
 * not preserve order. Only safe to use in a loop when
 * you are counting down from high index to low.
 * @param {Array} a - array.
 * @param {number} i - index to remove.
 */
exports.fastCut = (a,i) =>{ a[i] = a[a.length-1]; a.pop(); }

// Performs a recursive merge of variables from src to dest.
// Variables from src override variables in dest.
exports.recurMerge = recurMerge;

function recurMerge( src, dest ) {

	for( var key in src ) {

		if ( !src.hasOwnProperty(key) ) {
			continue;
		}

		var newVal = src[key];
		var oldVal = dest[key];
		if ( oldVal != null && oldVal instanceof Object && newVal instanceof Object ) {

			recurMerge( newVal, oldVal );

		} else {
			dest[key] = newVal;
		}

	}

}

// merges all variables of src into dest.
// values from src overwrite dest.
exports.merge = ( src, dest ) => {

	for( var key in src ) {

		if ( src.hasOwnProperty( key ) ) {
			dest[key] = src[key];
		}

	}

}