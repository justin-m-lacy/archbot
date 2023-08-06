import { DiscordBot } from "./discordbot";
import path from 'path';
import fs from 'fs';

type InitFunc = (bot: DiscordBot) => void;

export type PluginFile = {

	init?: InitFunc;

}

export const loadPlugins = (plugins_dir: string, init_func?: InitFunc) => {

	const plugins = [];

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

	const files = fs.readdirSync(dirPath, { withFileTypes: true });

	if (files.length === 1) {

		// If a single file, attempt to load that file as plugin.

		const file = files[0];
		const ext = path.extname(file.name).toLowerCase();
		if (!file.isFile() || (ext !== '.js' && ext !== '.ts')) return null;

		return requirePlugin(dirPath, file.name, init_func);

	}

	// multiple files exist. search for json plugin description.
	for (const file of files) {

		try {

			if (!file.isFile() || file.name !== 'plugin.json') continue;

			const res = loadPlugDesc(dirPath, file.name, init_func);

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

	try {

		console.log('load: ' + fileName);

		const ext = path.extname(fileName).toLowerCase();
		if (ext != '' && ext !== '.js' && ext !== '.ts') {
			console.log(`unexpected plugin extension: ${ext}`);
			return null;
		}

		const plug = require(path.resolve(plugPath, fileName));

		if (!plug) {
			throw new Error(`plugin not found: ${path.resolve(plugPath, fileName)}`);
		}
		init_func?.(plug);

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

	const data = fs.readFileSync(path.resolve(plugDir, descFile));
	let desc = JSON.parse(data.toString());

	let plug;

	if (Array.isArray(desc)) {

		const arr = desc;
		const plugs = [];
		for (let i = arr.length - 1; i >= 0; i--) {

			desc = arr[i];
			if (desc.plugin) {

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