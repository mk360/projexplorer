import { ClassToRender } from "./class-to-render";
import collectLines from "./collect-lines";
import * as fs from "fs";

function renderGraph(graph: ClassToRender) {
    const lines: string[] = collectLines(graph);
    console.log(lines);

    const htmlContent = `
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
${lines.join("\n")}
        </pre>
        <script type="module">
            import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
            mermaid.initialize({ startOnLoad: true, theme: "forest" });
        </script>
    </body>
</html>`;

    return htmlContent;
};

export default renderGraph;
