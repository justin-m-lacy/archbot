import { DiscordBot } from "./discordbot";

const fs = require('fs');
const path = require('path');

type InitFunc = (bot: DiscordBot) => void;

export type PluginFile = {

	init?: InitFunc;

}

export const loadPlugins = (plugins_dir: string, init_func?: InitFunc) => {

	let plugins = [];

	try {

		// Result is fs.Direct[]
		const dirs = fs.readdirSync(plugins_dir, { withFileTypes: true });

		let newPlugs;
		for (let dir of dirs) {

			if (!dir.isDirectory()) continue;

			newPlugs = loadPlugs(path.resolve(plugins_dir, dir.name), init_func);
			if (newPlugs) {
				if (Array.isArray(newPlugs)) Array.prototype.push.apply(plugins, newPlugs);
				else plugins.push(newPlugs);
			}

		}

	} catch (err) {
		console.error(err);
	}

	return plugins;

}

/**
 * Attempt to load and initialize all plugins found in a plugin directory.
 * @param {string} dirPath
 * @param {function} init_func
 */
const loadPlugs = (dirPath: string, init_func?: InitFunc) => {

	let files = fs.readdirSync(dirPath, { withFileTypes: true });

	if (files.length === 1) {

		// If a single file, attempt to load that file as plugin.

		let file = files[0];
		if (!file.isFile()) return null;

		var plug = requirePlugin(dirPath, file.name, init_func);
		return plug;

	}

	// multiple files exist. search for json plugin description.
	for (let file of files) {

		try {

			if (!file.isFile()) continue;

			if (path.extname(file.name) !== '.json') continue;

			//file = path.resolve( dir, file );

			let res = loadPlugDesc(dirPath, file.name, init_func);

			// might be multiple json files that are NOT plugins.
			// these return null but loop should still continue.
			if (res) return res;

		} catch (err) {
			console.error(err);
		}

	}
	return null;

}

/**
 *
 * @param {fs.Direct} fileName
 */
const requirePlugin = (plugPath: string, fileName: string, init_func?: InitFunc) => {

	console.log('loading plugin file: ' + fileName);
	if (path.extname(fileName) !== '.js') return null;

	fileName = path.resolve(plugPath, fileName);

	try {

		let plug = require(fileName);

		if (plug && init_func) init_func(plug);

		return plug;

	} catch (err) {
		console.error(err);
	}

	return null;

}

/**
 * Loads a json file in a plugin's folder. If the json file defines a plugin,
 * the plugin file is loaded and returned.
 * @param {*} plugDir
 * @param {*} descFile
 * @param {*} init_func
 */
const loadPlugDesc = (plugDir: string, descFile: string, init_func?: InitFunc) => {

	let data = fs.readFileSync(path.resolve(plugDir, descFile));
	let desc = JSON.parse(data);

	let plug;

	if (Array.isArray(desc)) {

		let a = desc;
		let plugs = [];
		for (let i = a.length - 1; i >= 0; i--) {

			desc = a[i];
			if (desc.plugin) {

				//if ( !desc.hasOwnProperty('name')) desc.name = desc.plugin;

				plug = requirePlugin(plugDir, desc.plugin, init_func);
				if (plug) plugs.push(plug);

			}

		}

		return plugs.length > 0 ? plugs : null;

	} else {

		if (!desc.plugin) return null;
		//if ( !desc.hasOwnProperty('name')) desc.name = desc.plugin;
		return requirePlugin(plugDir, desc.plugin, init_func);

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