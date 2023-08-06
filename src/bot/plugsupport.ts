import { DiscordBot } from "./discordbot";
import path from 'path';
import fs from 'fs';

const ParseExtensions = ['', '.js', '.ts'];

export interface PluginFile {

	initPlugin: (bot: DiscordBot) => void;

}

export const loadPlugins = async (plugins_dir: string ) => {

	const plugins:PluginFile[] = [];

	try {

		// Result is fs.Direct[]
		const dirs = fs.readdirSync(plugins_dir, { withFileTypes: true });

		for (let dir of dirs) {

			if (!dir.isDirectory()) continue;
			await loadPlugs(path.resolve(plugins_dir, dir.name), plugins);

		}

	} catch (err) {
		console.error(err);
	}

	return plugins;

}

/**
 * Attempt to load and initialize all plugins found in a plugin directory.
 * @param dirPath
 * @param init_func
 */
const loadPlugs = async (dirPath: string, results:PluginFile[] ) => {

	const files = fs.readdirSync(dirPath, { withFileTypes: true });

	// multiple files exist. search for json plugin description.
	for (const file of files) {

		try {

			const ext = path.extname(file.name).toLowerCase();
			if (!file.isFile() || !ParseExtensions.includes(ext)) continue;
	
			const plug = await import( path.resolve(dirPath, file.name));
			if ( isPlugin(plug)){
				results.push(plug);
			}

		} catch (err) {
			console.error(err);
		}

	}
	return null;

}

const isPlugin = ( plug?:any ):plug is PluginFile =>{
	return (plug && typeof plug === 'object'
			&& 'initPlugin' in plug
			&& typeof plug.initPlugin === 'function');
}