import { ClassToRender, ImportSymbol } from "./class-to-render";

const EXPLORED_FILES: { [k: string]: true } = {};

function collectLines(root: ClassToRender) {
    let lines: string[] = [];
    if (EXPLORED_FILES[root.name]) return [];
    EXPLORED_FILES[root.name] = true;

    // console.log(root.imports[0].src.imports);
    if (root.imports.length) {
        const mappedImports = root.imports.map((i) => collectLines(i.src).flat()).flat();
        lines = lines.concat(mappedImports);
    }
    lines = lines.concat(root.imports.map((imported) => imported.symbols.map((sym) => `${imported.src.name.trim()} --${getImportName(sym)}--> ${root.name.trim()}`)).flat());
    return lines;
};

function getImportName(symbol: ImportSymbol) {
    if (symbol.alias) {
        return `${symbol.name} as ${symbol.alias}`;
    }

    return symbol.name;
}

export default collectLines;
