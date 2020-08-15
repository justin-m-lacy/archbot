const fs = require('fs');
const path = require('path');

exports.loadPlugins = function( plugins_dir, init_func=null ) {

	let plugins = [];

	try {

		// Result is fs.Direct[]
		dirs = fs.readdirSync( plugins_dir, {withFileTypes:true} );

		let newPlugs;
		for( let dir of dirs ) {

			if ( !dir.isDirectory() ) continue;

			console.log('searching plug dir: ' + dir.name );

			newPlugs = loadPlugs( dir, init_func );
			if ( newPlugs ) plugins.push.apply( plugins, plus );

		}

	} catch ( err ) {
		console.error(err);
	}

	return plugins;

}

/**
 * Attempt to load and initialize all plugins found in a plugin directory.
 * @param {fs.Direct} dir
 * @param {function} init_func
 */
function loadPlugs( dir, init_func=null ) {

	let files = fs.readdirSync( dir.name, {withFileTypes:true} );

	if ( files.length === 1 ) {

		// If a single file, attempt to load that file as plugin.
		var plug = this.requirePlugin( dir, file, '' );
		if ( plug ) return [plug];

	}

	for( let file of files ) {

		try {

			if ( !file.isFile() ) continue;

			if ( !(path.extname(file.name) === '.json')) continue;

			//file = path.resolve( dir, file );

			let plugs = loadPlugDesc( dir, file );
			if ( plugs ) {

				if ( init_func != null ) {
					if ( Array.isArray( plugs ) ) plugs.forEach( (p)=>init_func(p) );
					else if ( init_func != null ) init_func(plugs);
				}
				return plugs;
			}

		} catch (err ){
			console.error(err);
		}

	}
	return null;

}

/**
 *
 * @param {fs.Direct} file
 */
function requirePlugin( dir, file, init_func=null ) {

	var name = file.name;

	console.log('loading plugin file: ' + name );

	if ( path.extname(name) !== '.js' ) continue;

	try {

		let plug = require( plugFile );

		if ( plug && init_func ) init_func( plug );

		return plug;

	} catch ( err ){
		console.error( err );
	}

	return null;

}

function loadPlugDesc( dir, descFile, init_func=null ) {

	let data = fs.readFileSync(descFile);
	let desc = JSON.parse( data );

	let plug;

	if ( Array.isArray( desc ) ) {

		let a = desc;
		let plugs = [];
		for( let i = a.length-1; i >= 0; i-- ) {

			desc = a[i];
			if ( desc.plugin ) {

				//if ( !desc.hasOwnProperty('name')) desc.name = desc.plugin;

				plug = requirePlugin( dir, desc.plugin, init_func );
				if ( plug ) plugs.push(plug);

			}

		}

		if ( plugs.length > 0 ) return plugs;

	} else {

		if ( !desc.plugin ) return null;
		//if ( !desc.hasOwnProperty('name')) desc.name = desc.plugin;
		return requirePlugin( dir, desc.plugin, init_func );

	}


}

// load plugin described by json.
/*function loadPlugin( plugDir, desc ){

	try {

		let plugFile = path.resolve( plugDir, desc.plugin );
		console.log( 'loading plugin: ' + desc.plugin );
		return require( plugFile );

	} catch ( err ){
		console.error( err );
	}

	return null;

}*/