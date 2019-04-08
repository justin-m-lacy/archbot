const fs = require( 'fs');

/**
 * @note the else-conditions are required since a promise callback is not a return.
 */

/**
 * @function
 * Attempts to delete a file.
 * @param {string} path - file location.
 * @returns {Promise<boolean,NodeJS.ErrnoException>}
 * @
 */
exports.deleteFile = path => new Promise( res,rej=> {

	fs.unlink( path, (err)=>{

		if ( !err ) res(true );
		else rej(err);

	});

});

/**
 * @function
 * Determines if file at path exists.
 * @param {string} path
 * @returns {Promise<boolean,NodeJS.ErrnoException>}
 */
exports.exists = path => new Promise( res,rej=>{

	fs.access( path,

		(err)=>{

			if ( !err ) res(true);
			else rej( err );

		});

});


/**
 * @function
 * @param {string} path
 * @param {?Object|string} [options=null] Encoding used as the encoding of the result. If not provided, `'utf8'` is used.
 * @returns {Promise<string[],NodeJS.ErrnoException>}
 */
const readdir = (path, options=null) => new Promise( (res,rej)=>{

	fs.readdir( path, options, (err,files)=>{

		if ( err ) rej(err);
		else res(files);

	});

});

exports.readdir = readdir;

/**
 * @function
 * Read a list of names of all files at the given path, excluding directories.
 * @param {string} path 
 * @param {*} options
 * @returns {Promise<string[], NodeJS.ErrnoException>}
 */
exports.readfiles = (path, options=null) => new Promise( (res,rej)=>{

	if ( path.charAt(path.length-1) != '/') path += '/';

	let count;
	let found = [];

	const statRes = (e,stats) => {

		if ( !e ) {
			if( stats.isFile() ) found.push(f);
		}
		if ( --count <= 0 ) res(found);

	}

	readdir( path, options ).then(

		files=>{

			count = files.length;
			for( let i = count-1; i>= 0;i-- ) {

				let f = files[i];
				fs.stat( path + f, statRes );

			}

		},
		err=>rej(err)
	);


});


/**
 * @function
 * @param {string} path
 * @returns {Object|null}
 */
exports.readJSONSync = path => {

	let data = fs.readFileSync( path );
	try {
		return JSON.parse( data );

	} catch(e){ return null; }

};

/**
 * @function
 * Attempt to create a directory
 * @param {string} path
 * @returns {Promise}
 */
exports.mkdir = path => new Promise( (res,rej)=> {

	if ( fs.existsSync(path) ) {
		res();
		return;
	}
	fs.mkdir( path,  err => {
		if ( err ) rej(err);
		else res();
	});

});

/**
 * @function
 * @param {string} path
 * @returns {Promise<*,NodeJS.ErrnoException>}
 */
exports.readFile = path => new Promise( (res,rej)=>{

	fs.readFile( path, (err,data)=>{

		if ( err ) rej(err);
		else res( data );

	});

});

/**
 * @function
 * @param {string} path
 * @returns {Promise<Object,Error>}
 */
exports.readJSON = path => new Promise( (res,rej)=>{

	fs.readFile( path, (err,data)=>{

		if ( err ) rej(err);
		else res( JSON.parse( data ) );

	});

});

/**
 * @function
 * @param {string} path
 * @param {*} data
 * @returns {Promise}
 */
exports.writeJSON = (path,data) => new Promise( (res, rej)=>{

	//console.log( 'data: ' + JSON.stringify(data));
	fs.writeFile( path, JSON.stringify(data), {flag:'w+'}, err=>{

		if ( err ) rej(err);
		else res();

	});

});