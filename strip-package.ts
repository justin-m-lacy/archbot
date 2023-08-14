#!/usr/bin/env ts-node

import { writeFile } from "fs/promises";
import { resolve } from "path";
import mainPackage from "./package.json";

/**
 * Strip package of values not needed for compiled app,
 * and changes scripts to run archbot.s from the package's director. 
 * @param packagePath 
 */
export const stripPackage = async (outputDir: string = './dist') => {

    const newPackage: any = Object.assign({}, mainPackage);

    /// compiled executable in same directory as compiled package.
    newPackage.main = "./archbot.js";

    /// compiled version has no devDependencies.
    newPackage.devDependencies = undefined;
    newPackage.bugs = undefined;
    newPackage.repository = undefined;
    newPackage.license = undefined;
    newPackage.keywords = undefined;

    newPackage.scripts = {
        start: "node ."
    };

    await writeFile(resolve(outputDir, 'package.json'), JSON.stringify(newPackage));

}

stripPackage();