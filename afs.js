const fs = require( 'fs');
//const promisify = require( 'util').promisify;
const fsPromises = fs.promises;

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
exports.deleteFile = path => new Promise( (res,rej)=> {

	fs.unlink( path, (err)=>{

		err ? rej(err) : res(true);

	});

});

/**
 * @function
 * Determines if file exists at path.
 * @param {string} path
 * @returns {Promise<boolean>}
 */
exports.exists = path => new Promise( (res)=>{

	fs.access( path,

		(err)=>{
			res( !err );
		});

});


/**
 * @function
 * @param {string} path
 * @param {?Object|string} [options=null] Encoding used as the encoding of the result. If not provided, `'utf8'` is used.
 * @returns {Promise<string[],NodeJS.ErrnoException>}
 */
const readdir = fsPromises.readdir;

/**
 * @function
 * Read a list of names of all files at the given path, excluding directories.
 * @param {string} path
 * @returns {Promise<string[], NodeJS.ErrnoException>}
 */
exports.readfiles = ( path ) => new Promise( (res,rej)=>{

	if ( path.charAt(path.length-1) != '/') path += '/'; // might be unncessary now?

	readdir( path, {withFileTypes:true} ).then(

		files=>{

			let found = [];

			for( let i = files.length-1; i>= 0;i-- ) {
				if ( files[i].isFile() ) found.push( files[i].name );
			}
			res(found);

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
 * Attempt to create a directory.
 * Directory already existing is not considered an error.
 * @param {string} path
 * @returns {Promise}
 */
exports.mkdir = path => {

	fsPromises.stat( path ).then(

		stat=>{

			if ( stat.isDirectory() ) return;
			else throw new Error('File exists and is not a directory.');

		},
		()=>{

			// file does not exist. this is intended.
			return fsPromises.mkdir( path );
		}
	);

};

/**
 * @function
 * @param {string} path
 * @returns {Promise<*,NodeJS.ErrnoException>}
 */
exports.readFile = fsPromises.readFile;

/**
 * @function
 * @param {string} path
 * @returns {Promise<Object,Error>}
 */
exports.readJSON = path=> new Promise( (res,rej)=>{

		fs.readFile( path, 'utf8', (err,data)=>{

			if ( err ) rej(err);
			else if ( data === undefined || data === null ) rej('File is null.');
			else {

				if ( data === '' ) res(null);

				else {

					res( JSON.parse(data));

				}
			}

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
		err ? rej(err) : res();
	});

});