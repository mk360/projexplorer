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

	getClassToRender(name: string, from: ClassToRender = this.root): ClassToRender {
		if (from.imports.length != 0) {
			for (let _import of from.imports) {
				// console.log(_import);
				if (_import.src)
					return _import.src.name === name ? _import.src : this.getClassToRender(name, _import.src);

			}

		}

		return undefined;
	};

	private recurse(currentRoot: ClassToRender, filename: string) {
		console.log("file : " + filename);
		console.log(currentRoot);
		const sourceFile = ts.createSourceFile(filename, fs.readFileSync(filename, "utf-8"), ts.ScriptTarget.Latest);

		console.log(sourceFile.referencedFiles);

		sourceFile.statements.filter((statement) => statement.kind == SyntaxKind.ImportDeclaration).forEach((importDeclaration) => {
			if (importDeclaration.getChildren(sourceFile).filter((impDecChildNodes) => ts.isImportClause(impDecChildNodes)).length === 0)
				return;

			let srcName = importDeclaration.getChildren(sourceFile).find((child) => ts.isStringLiteral(child)).text;
			let src: ClassToRender;
			let _import: Import = {
				src: undefined,
				symbols: []
			};

			currentRoot.imports.push(_import);

			if (src = this.getClassToRender(srcName)) {
				_import.src = src;
				_import.src.rank = Math.max(_import.src.rank, currentRoot.rank+1);
			} else {
				_import.src = {
					name: srcName,
					rank: currentRoot.rank+1,
					imports: []
				}

				let newFile: string = "";
				newFile = path.resolve(path.parse(filename).dir, srcName) + ".ts";
				// console.log(newFile);
				// console.log(srcName);

				console.log("from : " + filename);
				console.log("to : " + newFile);
				//Recursive call here
				this.recurse(_import.src, newFile);
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
						// console.log(impClauseChildNodes.find((child) => ts.isIdentifier(child)).text);
						_import.symbols.push({
							name: impClauseChildNodes.find((child) => ts.isIdentifier(child)).text
						});

					}

			});

		});
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

	console.dir(util.inspect(graph.root, false, null, true));
	// console.log(graph.root.imports);
} else {
	console.error("No package.json found in the current directory.");
}

// const packageJSON = require("")
// const entryPoint = ts.createSourceFile("package.json", )