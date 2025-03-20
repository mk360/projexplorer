interface Symbol {
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
    symbols: Symbol[];
}

export {ClassToRender, Import};
