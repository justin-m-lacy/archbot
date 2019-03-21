const fs = require('fs');
const path = require('path');

exports.loadPlugins = function( plugins_dir, init_func=null ) {

	let plugins = [];

	try {

		dirs = fs.readdirSync( plugins_dir );
	
		let plugs, stats;
		for( let dir of dirs ) {

			dir = path.resolve( plugins_dir, dir );
			stats = fs.statSync( dir );
			if ( !stats.isDirectory() ) continue;

			plugs = findAndLoad( dir, init_func );
			if ( plugs != null ) {
				plugins = plugins.concat( plugs );
			}

		}

	} catch ( err ) {
		console.error(err);
	} 

	return plugins;

}

/**
 * Searches the directory for a plugin description file,
 * and loads any plugins listed.
 * @param {string} dir 
 * @param {function} init_func 
 */
function findAndLoad( dir, init_func=null ) {

	let files = fs.readdirSync( dir );
	let stats;

	for( let file of files ) {

		try {
		
			if ( !(path.extname(file) === '.json')) continue;

			file = path.resolve( dir, file );
			stats = fs.statSync( file );
			if ( !stats.isFile() ) continue;

			let plugs = loadPlugDesc( dir, file );
			if ( plugs ) {

				if ( init_func != null ) {
					if ( plugs instanceof Array ) plugs.forEach( (p)=>init_func(p) );
					else if ( init_func != null ) init_func(plugs);
				}
				return plugs;
			}

		} catch (err ){
			console.log(err);
		}

	}
	return null;

}

function loadPlugDesc( dir, descFile ) {

	let data = fs.readFileSync(descFile);
	let desc = JSON.parse( data );

	let plug;

	if ( desc instanceof Array ) {

		let a = desc;
		let plugs = [];
		for( let i = a.length-1; i >= 0; i-- ) {

			desc = a[i];
			if ( desc.hasOwnProperty('plugin')) {
				if ( !desc.hasOwnProperty('name')) desc.name = desc.plugin;
				plug = loadPlugin( dir, desc );
				if ( plug ) plugs.push(plug);

			}

		}

		if ( plugs.length > 0 ) return plugs;

	} else {

		if ( !desc.hasOwnProperty( 'plugin')) return null;
		if ( !desc.hasOwnProperty('name')) desc.name = desc.plugin;
		return loadPlugin( dir, desc );

	}


}

// load plugin described by json.
function loadPlugin( plugDir, desc ){

	try {

		let plugFile = path.resolve( plugDir, desc.plugin );
		console.log( 'loading plugin: ' + desc.plugin );
		return require( plugFile );

	} catch ( err ){
		console.error( err );
	}

	return null;

}