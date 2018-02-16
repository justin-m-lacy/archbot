const fs = require( 'fs');

exports.exists = ( path ) => new Promise( (res,rej)=>{
	fs.access( path,
		(err)=>{
			if ( err ) res(false);
			else res(true);
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
	return JSON.parse( data );

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

exports.writeJSON = (path,data) => new Promise( (res, rej)=>{

	console.log( 'data: ' + JSON.stringify(data));
	fs.writeFile( path, JSON.stringify(data), {flag:'w+'}, (err)=>{

		if ( err ) {
			console.log('file err ' + err )
			rej(err);
		}
		else {
			console.log( 'write file success.');
			res();
		}

	});

});