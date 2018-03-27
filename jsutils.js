exports.randElm = (arr)=>{
	const ind = Math.floor( Math.random()*(arr.length));
	return arr[ind];
}

exports.random = (min, max)=>{
	return Math.round( Math.random()*(max-min)) + min;
}

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