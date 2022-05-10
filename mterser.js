/**
 * @Mtillmann github
 * minify all files matched by given glob pattern through terser. Requires `glob` to be installed:
 *
 * npm i glob --save-dev
 *
 * Place the scripts in your projects scripts folder, then add it to your package.json's scripts like this
 *
 * "mterser": "node scripts/mterser.js --glob dist/umd/*.js --compress --mangle --comments false",
 *
 * and run it by calling `npm run mterser`. A `terser` npm script should also be available, see `--terser-cmd` below.
 *
 * Options
 *
 * --glob       required    glob pattern to match source files
 * --terser-cmd optional    defaults to `npm run terser`. The npm script should exist and simple call "terser".
 * --dryrun     optional    Will only display the terser commands that are generated
 * --outdir     optional    When given, this is the folder that the generated files are placed in
 *
 * By default the minified filenames have `.min` inserted before the final `.js` extension. To change that behaviour,
 * modify the minifiedFilename and isFileMinified functions below.
 *
 */

 let terserOptions = [],
 globPattern,
 outDir = null,
 dryRun = false,
 terserCommand = 'npm run terser';


const glob = require('glob'),
 {exec} = require('child_process'),
 terserOptionShortCuts = {
     "-V": "--version",
     "-p": "--parse",
     "-c": "--compress",
     "-m": "--mangle",
     "-f": "--format",
     "-o": "--output",
     "-d": "--define",
     "-e": "--enclose"
 },
 expandOptionName = option => option in terserOptionShortCuts ? terserOptionShortCuts[option] : option,
 isOption = string => string.slice(0, 2) === '--',
 type = string => /^true|false$/.test(string) ? string === 'true' : /^\d+$/.test(string) ? parseInt(string, 10) : string,
 minifiedFilename = filename => filename,
 isFileMinified = filename => /\.min\.js$/.test(filename),
 args = process.argv.slice(2),
 terminator = '_____END_____';
args.push(terminator);

args.reduce((previous, current) => {
 if (previous && isOption(expandOptionName(previous))) {
     const option = expandOptionName(previous);

     if (option === '--glob') {
         globPattern = current;
     } else if (option === '--outdir') {
         outDir = current;
     } else if (option === '--terser-cmd') {
         terserCommand = current;
     } else if (option === '--dryrun') {
         dryRun = true;
     } else {
         terserOptions.push(previous);
         if (!isOption(expandOptionName(current)) && current !== terminator) {
             terserOptions.push(type(current));
         }
     }
 }
 return current;
}, null);

if (dryRun) {
 console.log('DRY RUN:');
}

glob(globPattern, {}, (error, files) => {
 if (error) {
     return console.log(`glob error : ${error}`);
 }
 files.forEach(file => {
     let input = file,
         output = minifiedFilename(file),
         options = [...terserOptions];
     if (outDir) {
         output = (outDir + '/' + output.split('/').pop()).replace(/\/{2,}/g, '/');
     }
     if (isFileMinified(file)) {
         return console.log(`skip: ${file}`);
     }
     options.unshift(input);
     options.unshift('--');
     options.unshift(terserCommand);
     options.push('--output');
     options.push(output);
     if (dryRun) {
         return console.log(options.join(' '));
     }
     exec(options.join(' '));
 });
});
