#!/usr/bin/env node

import ts, { SyntaxKind } from "typescript";
import * as fs from "fs";
import * as path from "path";
console.log(process.env);

const packageJsonPath = path.join(process.cwd(), "package.json");

if (fs.existsSync(packageJsonPath)) {
    const { main } = require(packageJsonPath);
    const filepath = path.join(process.cwd(), main);
    // additional check if it's a ts file or not, if it's a module or not, etc etc.
    const sourceFile = ts.createSourceFile(filepath, fs.readFileSync(filepath, "utf-8"), ts.ScriptTarget.Latest);
} else {
    console.error("No package.json found in the current directory.");
}

// const packageJSON = require("")
// const entryPoint = ts.createSourceFile("package.json", )