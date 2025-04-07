import { ClassToRender } from "./class-to-render";
import * as fs from "fs";
import * as path from "path";
import renderGraph from "./render-graph";

type NodeShape = "default" | "round-edges" | "stadium" | "circle" | "asymmetric" | "rhombus" | "hexagon" | "parallelogram" | "parallelogram-alt" | "trapezoid";

interface GraphGenOptions {
    outputFile: string;
    content: ClassToRender;
    nodeShapes?: NodeShape;
}

function generateGraph({ outputFile, content, nodeShapes }: GraphGenOptions) {
    const cwd = process.cwd();
    const outputPath = path.join(cwd, outputFile);
    if (!fs.existsSync(outputPath)) {
        const splitPath = outputFile.split("/");
        if (splitPath.length > 1) {
            splitPath.pop();
            const finalDir = splitPath.join("/");
            fs.mkdirSync(finalDir, { recursive: true });
        }
    }
    const fileContent = renderGraph(content);
    fs.writeFileSync(outputPath.endsWith(".html") ? outputPath : outputPath + ".html", fileContent);
};

export default generateGraph;
