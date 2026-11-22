import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

// Next resolves the server-only marker at build time. Unit tests replace only
// that marker and explicit test doubles; production source is left unchanged.
export function loadServerModule(relativePath, doubles = {}) {
  const filename = path.resolve(relativePath);
  const require = createRequire(filename);
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
    fileName: filename,
  });
  const result = { exports: {} };
  const testRequire = name => {
    if (name === "server-only") return {};
    if (Object.hasOwn(doubles, name)) return doubles[name];
    if (name.startsWith(".")) {
      const candidate = path.resolve(path.dirname(filename), `${name}.ts`);
      if (fs.existsSync(candidate)) return loadServerModule(path.relative(process.cwd(), candidate), doubles);
    }
    return require(name);
  };
  new Function("require", "module", "exports", outputText)(testRequire, result, result.exports);
  return result.exports;
}
