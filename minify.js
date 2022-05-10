// minify.js
//
var Terser = require("terser");
var fs = require("fs");
var path = require("path");

function getAllFiles(dirPath, arrayOfFiles) {
    let files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(__dirname, dirPath, "/", file));
        }
    });

    return arrayOfFiles.filter(path => path.match(/\.js$/));
}

function minifyFiles(filePaths) {
    return Promise.all(

        filePaths.map( (f)=>Terser.minify(fs.readdirSync(f,'utf8')).then(out=>fs.writeFileSync(f, out.code)) )
    );

}

const files = getAllFiles("./dist");
minifyFiles(files);