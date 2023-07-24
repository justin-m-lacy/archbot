import fs from 'fs';
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
export const deleteFile = (path: string) => new Promise((res, rej) => {

	fs.unlink(path, (err) => {

		err ? rej(err) : res(true);

	});

});

/**
 * @function
 * Determines if file exists at path.
 * @param {string} path
 * @returns {Promise<boolean>}
 */
export const exists = (path: string): Promise<boolean> => new Promise((res) => {

	fs.access(path,

		(err) => {
			res(!err);
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
export const readfiles = (path: string) => new Promise((res, rej) => {

	if (path.charAt(path.length - 1) != '/') path += '/'; // might be unncessary now?

	readdir(path, { withFileTypes: true }).then(

		files => {

			const found = [];

			for (let i = files.length - 1; i >= 0; i--) {
				if (files[i].isFile()) found.push(files[i].name);
			}
			res(found);

		},
		err => rej(err)
	);


});

/**
 * @function
 * Attempt to create a directory.
 * Directory already existing is not considered an error.
 * @param {string} path
 * @returns {Promise}
 */
export const mkdir = (path: string) => {

	return fsPromises.stat(path).then(

		stat => {

			if (stat.isDirectory()) return;
			else throw new Error('File exists and is not a directory.');

		},
		() => {

			// file does not exist. this is intended.
			return fsPromises.mkdir(path, { recursive: true });
		}
	);

};

/**
 * @function
 * @param {string} path
 * @returns {Promise<*,NodeJS.ErrnoException>}
 */
export const readFile = fsPromises.readFile;

/**
 * @function
 * @param {string} path
 * @returns {Promise<Object,Error>}
 */
export const readJSON = (path: string) => new Promise((res, rej) => {

	fs.readFile(path, 'utf8', (err, data) => {

		if (err) rej(err);
		else if (data === undefined || data === null) rej('File is null.');
		else {

			if (data === '') res(null);

			else {

				res(JSON.parse(data));

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
export const writeJSON = (path: string, data: any) => new Promise<void>((res, rej) => {

	//console.log( 'data: ' + JSON.stringify(data));
	fs.writeFile(path, JSON.stringify(data), { flag: 'w+' }, err => {
		err ? rej(err) : res();
	});

});