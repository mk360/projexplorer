import fs from "fs";
import ClassToRender from "./class-to-render";

function collectLines(root: ClassToRender) {
    let lines: string[] = [];
    if (root.imports.length) {
        const mappedImports = root.imports.map((i) => collectLines(i).flat()).flat();
        lines = lines.concat(mappedImports);
    }
    lines = lines.concat(root.imports.map((imported) => `${imported.name.trim()} --> ${root.name.trim()}`));
    return lines;
};

function renderGraph(graph: ClassToRender) {
    const lines: string[] = collectLines(graph);
    return lines.join("\n");
};

const htmlFile = `
<!DOCTYPE html>
<html>
    <head>
        <title>Generated Graph for Project</title>
        <meta name="title" content="Generated Documentation for Project">
        <meta name="description" content="Generated Documentation for Project">
        <meta name="keywords" content="project,doc">
        <meta name="robots" content="noindex, nofollow">
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <meta name="language" content="English">
        <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body>
        <pre class="mermaid">
graph
${renderGraph({ name: "Base", imports: [{ name: "Samir", imports: [{ name: "Daddy", imports: [] }, { name: "Mommy", imports: [] }] }, { name: "Tasnim", imports: [] }] })}
        </pre>
        <script type="module">
            import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
            mermaid.initialize({ startOnLoad: true });
        </script>
    </body>
</html>`;

fs.writeFileSync("test.html", htmlFile);
