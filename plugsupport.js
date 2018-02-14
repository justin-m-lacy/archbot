const fs = require('fs');
const path = require('path');

let plugins = {};

exports.loadPlugins = function( plugins_dir, init_func=null ) {

	try {

		dirs = fs.readdirSync( plugins_dir );
	
		let plugin, dir, stats;
		for( let dir of dirs ) {

			dir = path.resolve( plugins_dir, dir );
			stats = fs.statSync( dir );
			if ( !stats.isDirectory() ) continue;

			plugin = findAndLoad( dir );
			if ( init_func != null && plugin != null ){
				init_func(plugin);
			}

		}

	} catch ( err ) {
		console.log(err);
	}

	return plugins;

}

// look for a plugin desc file.
function findAndLoad( dir ) {

	let files = fs.readdirSync( dir );
	let stats;

	for( let file of files ) {

		try {
		
			if ( !(path.extname(file) === '.json')) continue;

			file = path.resolve( dir, file );
			stats = fs.statSync( file );
			if ( !stats.isFile() ) continue;

			let desc = loadPlugDesc( file );
			if ( !desc ) continue;

			// desc file.
			let plugin = loadPlugin( dir, desc );
			if ( plugin ) {
				desc[desc.name] = plugin;
				return plugin;
			}

		} catch (err ){
			console.log(err);
		}

	}
	return null;

}

function loadPlugDesc( descPath ) {

	console.log( 'loading: ' + descPath );
	let data = fs.readFileSync(descPath);
	let desc = JSON.parse( data );

	if ( !desc.hasOwnProperty( 'plugin')) return null;
	if ( !desc.hasOwnProperty('name')) desc.name = desc.plugin;

	return desc;

}

// load plugin described by json.
function loadPlugin( plugDir, desc ){

	try {

		let plugFile = path.resolve( plugDir, desc.plugin );
		return require( plugFile );

	} catch ( err ){
		console.log( err );
	}

	return null;

}