interface ImportSymbol {
    name: string;
    alias?: string;
}

interface ClassToRender {
    name: string;
    rank: number;
    imports: Import[];
}

interface Import {
    src: ClassToRender;
    symbols: ImportSymbol[];
}

export { ClassToRender, Import, ImportSymbol };

