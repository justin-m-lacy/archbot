const fs = require( 'fs');

exports.readdir = (path, options=null) => new Promise( (res,rej)=>{

	fs.readdir( path, options, (err,files)=>{

		if ( err )rej(err);
		else
			res(files);

	});

});

exports.readJSON = path => new Promise( (res,rej)=>{

	fs.readFile( path, (err,data)=>{

		if ( err )
			rej(err);
		else {
			let json = JSON.parse( data );
			res( json );
		 }
	});

});

exports.readJSONSync = path => {

	let data = fs.readFileSync( path );
	return JSON.parse( data );

};

exports.mkdir = path => new Promise( (res,rej)=> {

	fs.mkdir( path, function( err ) {
		if ( err ) rej(err);
		else
		res();
	});

});

exports.writeJSON = (path,data) => new Promise( (res, rej)=>{

	fs.writeFile( path, JSON.stringify(data), {flag:'w+'}, (err)=>{

		if ( err ) rej(err);
		else
		res();

	});

});