#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import ts from "typescript";
import { ClassToRender, Import } from "./class-to-render";
import generateGraph from "./generate-graph";

const util = require('util');
const readline = require('readline');

const packageJsonPath = path.join(process.cwd(), "package.json");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

class DependanceGraph {
    root: ClassToRender;
    entrySourceFile: ts.SourceFile;

    print(root = this.root, tabs: string = '') {
        console.log(tabs, root);

        for (let import_ of root.imports)
            this.print(import_.src, tabs + '\t');
    };

    flattenGraph(): ClassToRender[] {
        return this.recurseFlat([this.root], this.root);
    };

    recurseFlat(flatGraph: ClassToRender[], root: ClassToRender) {
        for (let _import of root.imports) {
            if (_import.src && !flatGraph.find((node) => _import.src.name === node.name)) {
                flatGraph.push(_import.src)

                this.recurseFlat(flatGraph, _import.src)
            }

        }

        return flatGraph;
    }

    /**
     * Search for a node that could already be in the graph
     */
    getClassToRender(name: string, from: ClassToRender = this.root, tabs: string = ""): ClassToRender | undefined {
        return this.flattenGraph().find((node) => name === node.name) || undefined;
    };

    private recurse(currentRoot: ClassToRender, filename: string, tabs: string = "") {
        const sourceFile = ts.createSourceFile(filename, fs.readFileSync(filename, "utf-8"), ts.ScriptTarget.Latest);

        let importDeclarations = sourceFile.statements.filter((statement) => ts.isImportDeclaration(statement))
        if (importDeclarations.length === 0) {
            return;
        }

        for (let importDeclaration of importDeclarations) {
            let importClauses = importDeclaration.getChildren(sourceFile).filter((child) => ts.isImportClause(child))

            if (importClauses.length === 0)
                continue;

            let newImport: Import = {
                src: undefined,
                symbols: []
            };
            currentRoot.imports.push(newImport);

            for (let importClause of importClauses) {
                importClause.getChildren(sourceFile).forEach((child) => {
                    if (ts.isNamedImports(child)) {
                        let importSpecifiers = child.getChildren(sourceFile).filter((childschild) => ts.isImportSpecifier(childschild));

                        for (let importSpecifier of importSpecifiers) {
                            let identifier = importSpecifier.getChildren(sourceFile).find((child) => ts.isIdentifier(child));
                            newImport.symbols.push({ name: identifier.getText(sourceFile) });
                        }

                    } else if (ts.isNamespaceImport(child)) {
                        let identifier = child.getChildren(sourceFile).find((childschild) => ts.isIdentifier(childschild));
                        newImport.symbols.push({ name: "*", alias: identifier.getText(sourceFile) });

                    } else if (ts.isIdentifier(child)) {
                        newImport.symbols.push({ name: child.text });
                    }

                });

            }

            let importSource = importDeclaration.getChildren(sourceFile).find((child) => ts.isStringLiteral(child)).text;
            let isNodeModule = !importSource.startsWith('./') && !importSource.startsWith('../')

            if (!isNodeModule) {
                let importSourceFile = path.resolve(path.parse(filename).dir, importSource);
                if (!importSourceFile.match(/\..+?$/)) importSourceFile += ".ts"; // if file doesn't have an extension, assume it's a .ts file
                let src: ClassToRender;

                if (src = this.getClassToRender(importSourceFile)) {
                    newImport.src = src;
                    newImport.src.rank = Math.max(newImport.src.rank, currentRoot.rank + 1);

                    console.log(tabs, "Found:", importSourceFile);
                } else {
                    newImport.src = {
                        name: importSourceFile,
                        rank: currentRoot.rank + 1,
                        imports: []
                    };

                    this.recurse(newImport.src, importSourceFile, tabs + '\t');
                }

            } else {
                newImport.src = {
                    name: `node_modules_${importSource}`,
                    rank: currentRoot.rank + 1,
                    imports: []
                };
            }
        }

        console.log(tabs, "Reached EOF", '\n');
    }

    buildGraph(sourceFile: ts.SourceFile) {
        this.entrySourceFile = sourceFile;
        this.root = {
            name: sourceFile.fileName,
            rank: 0,
            imports: []
        };

        this.recurse(this.root, this.entrySourceFile.fileName);
    };

};

if (fs.existsSync(packageJsonPath)) {
    const { main } = require(packageJsonPath);
    const filepath = path.join(process.cwd(), main);
    // additional check if it's a ts file or not, if it's a module or not, etc etc.
    const sourceFile = ts.createSourceFile(filepath, fs.readFileSync(filepath, "utf-8"), ts.ScriptTarget.Latest);

    let root: ClassToRender = {
        name: filepath,
        rank: 0,
        imports: []
    };

    let graph: DependanceGraph = new DependanceGraph;
    graph.root = root;
    graph.buildGraph(sourceFile);

    generateGraph({
        outputFile: "test.svg",
        content: graph.root,
    })

    process.exit(0);

    // console.dir(util.inspect(graph.root, false, null, true));
    // console.log(graph.flattenGraph());
    // graph.print();
    // console.log(graph.root.imports);
} else {
    console.error("No package.json found in the current directory.");
}

// const packageJSON = require("")
// const entryPoint = ts.createSourceFile("package.json", )