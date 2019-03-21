const fs = require( 'fs');

/**
 * {string}
 */
exports.deleteFile = ( path ) => new Promise( (res,rej)=> {

	fs.unlink( path, (err)=>{
		if ( err ) { console.log(err); res(false); }
		else res(true);
	});

});

/**
 * {string}
 */
exports.exists = ( path ) => new Promise( (res,rej)=>{
	fs.access( path,
		(err)=>{
			if ( err ) res(false);
			else res(true);
		});
});

/**
 * Reads a list of all files from the given path, and excludes
 * directories.
 * @param {string} path 
 * @param {*} options 
 */
exports.readfiles = (path, options=null) => new Promise( (res,rej)=>{

	if ( path.charAt(path.length-1) != '/') path += '/';

	let count = 0;
	let found = [];

	function statRes(e,stats,f) {

		count--;
		if ( !e ) {
			if( stats.isFile() ) found.push(f);
		}
		if ( count <= 0 ) res(found);

	}

	fs.readdir( path, options, (err,files)=>{

		if ( err )res(found);
		else {

			count = files.length;
			for( let i = count-1; i>= 0;i-- ) {

				let f = files[i];
				fs.stat( path + f, (e,stats)=>statRes(e,stats,f)  );

			}

		}

	});

});

exports.readdir = (path, options=null) => new Promise( (res,rej)=>{

	fs.readdir( path, options, (err,files)=>{

		if ( err )rej(err);
		else
			res(files);

	});

});


exports.readJSONSync = path => {

	let data = fs.readFileSync( path );
	try {
		return JSON.parse( data );
	} catch(e){ return null; }
};

exports.mkdir = path => new Promise( (res,rej)=> {

	if ( fs.existsSync(path) ) {
		res();
		return;
	}
	fs.mkdir( path, function( err ) {
		if ( err ) rej(err);
		else res();
	});

});

/**
 * {string}
 */
exports.readJSON = path => new Promise( (res,rej)=>{

	fs.readFile( path, (err,data)=>{

		if ( err ) res(null);
		else {

			try {
				res( JSON.parse( data ) );
			} catch (e) { res(null); }
			
		 }

	});

});

exports.writeJSON = (path,data) => new Promise( (res, rej)=>{

	//console.log( 'data: ' + JSON.stringify(data));
	fs.writeFile( path, JSON.stringify(data), {flag:'w+'}, (err)=>{

		if ( err ) {
			console.log('file err ' + err )
			rej(err);
		}
		else res();

	});

});