#!/usr/bin/env node

import ts, { isImportSpecifier, SyntaxKind } from "typescript";
import * as fs from "fs";
import * as path from "path";
import {ClassToRender, Import} from "./class-to-render";
// console.log(process.env);

const util = require('util');

const packageJsonPath = path.join(process.cwd(), "package.json");

class DependanceGraph {
	root: ClassToRender;
	entrySourceFile: ts.SourceFile;

	flattenGraph(): ClassToRender[] {
		let flatGraph = [this.root];

		return this.recurseFlat(flatGraph, this.root);
	};

	recurseFlat(flatGraph: ClassToRender[], root: ClassToRender) {
		for (let _import of root.imports) {
			// console.log(_import)
			if (_import.src && !flatGraph.find((node) => _import.src.name === node.name)) {
				flatGraph.push(_import.src)

				return this.recurseFlat(flatGraph, _import.src)
			}

		}

		return flatGraph;
	}

	getClassToRender(name: string, from: ClassToRender = this.root, tabs: string = ""): ClassToRender {
		let flatGraph = this.flattenGraph();
		// console.log(flatGraph);
		let ctr: ClassToRender;

		if (ctr = flatGraph.find((node) =>  name === node.name))
			return ctr;
		else
			return undefined
	};

	private recurse(currentRoot: ClassToRender, filename: string) {
		// console.log("file : " + filename);
		// console.log(currentRoot);
		const sourceFile = ts.createSourceFile(filename, fs.readFileSync(filename, "utf-8"), ts.ScriptTarget.Latest);

		let importDeclarations = sourceFile.statements.filter((statement) => ts.isImportDeclaration(statement))
		if (importDeclarations.length === 0)
			return;

		for (let importDeclaration of importDeclarations) {
			let importClauses = importDeclaration.getChildren(sourceFile).filter((child) => ts.isImportClause(child))

			if (importClauses.length === 0)
				continue;

			let newImport: Import = {
				src: undefined,
				symbols: []
			};
			currentRoot.imports.push(newImport);

			let importSource = importDeclaration.getChildren(sourceFile).find((child) => ts.isStringLiteral(child)).text;
			let isNodeModule = !importSource.startsWith('./') && !importSource.startsWith('../')

			if (!isNodeModule) {
				let importSourceFile = path.resolve(path.parse(filename).dir, importSource);
				let src: ClassToRender;

				if (src = this.getClassToRender(importSourceFile)) {
					newImport.src = src;
					newImport.src.rank = Math.max(newImport.src.rank, currentRoot.rank+1);
				} else {
					newImport.src = {
						name: importSourceFile,
						rank: currentRoot.rank+1,
						imports: []
					}

					this.recurse(newImport.src, importSourceFile+'.ts');
				}

			}

			for (let importClause of importClauses) {
				importClause.getChildren(sourceFile).forEach((child) => {
					if (ts.isNamedImports(child)) {
						let importSpecifiers = child.getChildren(sourceFile).filter((childschild) => ts.isImportSpecifier(childschild));

						for (let importSpecifier of importSpecifiers) {
							let identifier = importSpecifier.getChildren(sourceFile).find((child) => ts.isIdentifier(child));
							newImport.symbols.push({name: identifier.getText()});
						}

					} else if (ts.isNamespaceImport(child)) {
						let identifier = child.getChildren(sourceFile).find((childschild) => ts.isIdentifier(childschild));
						newImport.symbols.push({name: "*", alias: identifier.getText()});

					} else if (ts.isIdentifier(child)) {
						newImport.symbols.push({name: child.text});
					}

				});

			}

		}


		// sourceFile.statements.filter((statement) => ts.isImportDeclaration(statement)/*statement.kind == SyntaxKind.ImportDeclaration*/).forEach((importDeclaration) => {
		// 	if (importDeclaration.getChildren(sourceFile).filter((impDecChildNodes) => ts.isImportClause(impDecChildNodes)).length === 0)
		// 		return;

		// 	let srcName = importDeclaration.getChildren(sourceFile).find((child) => ts.isStringLiteral(child)).text;
		// 	// console.log(srcName);

		// 	let isNodeModule = srcName.startsWith("./") || srcName.startsWith('../');

		// 	srcName = path.resolve(path.parse(filename).dir, srcName);
		// 	let src: ClassToRender;
		// 	let _import: Import = {
		// 		src: undefined,
		// 		symbols: []
		// 	};

		// 	currentRoot.imports.push(_import);

		// 	console.log(currentRoot);
		// 	console.log("Looking for :", srcName)
		// 	if (src = this.getClassToRender(srcName)) {
		// 		console.log(srcName, "already there")
		// 		_import.src = src;
		// 		_import.src.rank = Math.max(_import.src.rank, currentRoot.rank+1);
		// 		// console.log("module " + srcName + " already there")
		// 		// console.log(_import.src);
		// 		console.log(currentRoot,'\n');
		// 	} else {
		// 		console.log("Not found, adding", srcName)
		// 		_import.src = {
		// 			name: srcName,
		// 			rank: currentRoot.rank+1,
		// 			imports: []
		// 		}

		// 		let newFile: string = "";
		// 		newFile = path.resolve(path.parse(filename).dir, srcName) + ".ts";
		// 		// console.log(newFile);
		// 		// console.log(srcName);

		// 		// console.log("from : " + filename);
		// 		// console.log("to : " + newFile);
		// 		//Recursive call here

		// 		// console.log(isNodeModule);

		// 		console.log(currentRoot,'\n');
		// 		if (!isNodeModule)
		// 			this.recurse(_import.src, srcName + ".ts");
		// 	}
			
		// 	importDeclaration.getChildren(sourceFile).filter((impDecChildNodes) => ts.isImportClause(impDecChildNodes)).forEach((importClause) => {
		// 		let impClauseChildNodes = importClause.getChildren(sourceFile);
		// 		let childRoot;

		// 		if (childRoot = impClauseChildNodes.find((node) => ts.isNamedImports(node))) {
		// 			childRoot.getChildren(sourceFile).filter((child) => ts.isImportSpecifier(child)).forEach((importSpecifier) => {
		// 				_import.symbols.push({name: importSpecifier.getChildren(sourceFile).find((id) => ts.isIdentifier(id)).getText()});
		// 			});

		// 		} else if (childRoot = impClauseChildNodes.find((node) => ts.isNamespaceImport(node))) {
		// 			_import.symbols.push({
		// 				name: "*",
		// 				alias: childRoot.getChildren(sourceFile).find((child) => ts.isIdentifier(child)).getText()
		// 			});

		// 		} else {
		// 			// console.log(impClauseChildNodes.find((child) => ts.isIdentifier(child)).text);
		// 			_import.symbols.push({
		// 				name: impClauseChildNodes.find((child) => ts.isIdentifier(child)).text
		// 			});

		// 		}

		// 	});

		// });

	}

	buildGraph(sourceFile: ts.SourceFile) {
		this.entrySourceFile = sourceFile;
		this.root = {
			name: sourceFile.fileName,
			rank: 0,
			imports: []
		};

		// console.log(this.entrySourceFile.fileName);
		this.recurse(this.root, this.entrySourceFile.fileName);
/*		this.sourceFile.statements.filter((statement) => statement.kind == SyntaxKind.ImportDeclaration).forEach((importDeclaration) => {
			let srcName = importDeclaration.getChildren(this.sourceFile).find((child) => ts.isStringLiteral(child)).text;
			let src: ClassToRender;
			let _import: Import = {
				src: undefined,
				symbols: []
			};

			currentRoot.imports.push(_import);

			if (src = graph.getClassToRender(srcName)) {
				_import.src = src;
				_import.src.rank = Math.max(_import.src.rank, currentRoot.rank+1);
			} else {
				_import.src = {
					name: srcName,
					rank: currentRoot.rank+1,
					imports: []
				}

				//Recursive call here
			}
			
			importDeclaration.getChildren(this.sourceFile).filter((impDecChildNodes) => ts.isImportClause(impDecChildNodes)).forEach((importClause) => {
					let impClauseChildNodes = importClause.getChildren(this.sourceFile);
					let childRoot;

					if (childRoot = impClauseChildNodes.find((node) => ts.isNamedImports(node))) {
						childRoot.getChildren(this.sourceFile).filter((child) => ts.isImportSpecifier(child)).forEach((importSpecifier) => {
							_import.symbols.push({name: importSpecifier.getChildren(this.sourceFile).find((id) => ts.isIdentifier(id)).getText()});
						});

					} else if (childRoot = impClauseChildNodes.find((node) => ts.isNamespaceImport(node))) {
						_import.symbols.push({
							name: "*",
							alias: childRoot.getChildren(this.sourceFile).find((child) => ts.isIdentifier(child)).getText()
						});

					} else {
						console.log(impClauseChildNodes.find((child) => ts.isIdentifier(child)).text);
						_import.symbols.push({
							name: impClauseChildNodes.find((child) => ts.isIdentifier(child)).text
						});

					}

			});

		});*/
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

/*	sourceFile.statements.filter((statement) => statement.kind == SyntaxKind.ImportDeclaration).forEach((importDeclaration) => {
		let srcName = importDeclaration.getChildren(sourceFile).find((child) => ts.isStringLiteral(child)).text;
		let src: ClassToRender;
		let _import: Import = {
			src: undefined,
			symbols: []
		};

		root.imports.push(_import);

		if (src = graph.getClassToRender(srcName)) {
			_import.src = src;
			_import.src.rank = Math.max(_import.src.rank, root.rank+1);
		} else {
			_import.src = {
				name: srcName,
				rank: root.rank+1,
				imports: []
			}

			//Recursive call here
		}
		
		importDeclaration.getChildren(sourceFile).filter((impDecChildNodes) => ts.isImportClause(impDecChildNodes)).forEach((importClause) => {
				let impClauseChildNodes = importClause.getChildren(sourceFile);
				let childRoot;

				if (childRoot = impClauseChildNodes.find((node) => ts.isNamedImports(node))) {
					childRoot.getChildren(sourceFile).filter((child) => ts.isImportSpecifier(child)).forEach((importSpecifier) => {
						_import.symbols.push({name: importSpecifier.getChildren(sourceFile).find((id) => ts.isIdentifier(id)).getText()});
					});

				} else if (childRoot = impClauseChildNodes.find((node) => ts.isNamespaceImport(node))) {
					_import.symbols.push({
						name: "*",
						alias: childRoot.getChildren(sourceFile).find((child) => ts.isIdentifier(child)).getText()
					});

				} else {
					console.log(impClauseChildNodes.find((child) => ts.isIdentifier(child)).text);
					_import.symbols.push({
						name: impClauseChildNodes.find((child) => ts.isIdentifier(child)).text
					});

				}

		});

	});*/

	// console.dir(util.inspect(graph.root, false, null, true));
	console.log(graph.flattenGraph());
	// console.log(graph.root.imports);
} else {
	console.error("No package.json found in the current directory.");
}

// const packageJSON = require("")
// const entryPoint = ts.createSourceFile("package.json", )