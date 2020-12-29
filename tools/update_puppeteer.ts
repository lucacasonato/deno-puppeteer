import { Untar } from "https://deno.land/std@0.82.0/archive/tar.ts";
import { basename, dirname } from "https://deno.land/std@0.82.0/path/mod.ts";
import { gzipDecode } from "https://deno.land/x/wasm_gzip@v1.0.0/mod.ts";
import { endsWith } from "https://deno.land/std@0.82.0/bytes/mod.ts";

const version = Deno.args[0];

const tarballReq = await fetch(
  `https://registry.npmjs.org/puppeteer-core/-/puppeteer-core-${version}.tgz`
);
const tarballData = gzipDecode(new Uint8Array(await tarballReq.arrayBuffer()));
const tarballReader = new Deno.Buffer(tarballData);
const untar = new Untar(tarballReader);

const originalFiles: Record<string, Uint8Array> = {};

for await (const file of untar) {
  const filename = file.fileName.substring("package/".length);
  originalFiles[filename] = await Deno.readAll(file);
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const protocolReq = await fetch(
  "https://unpkg.com/devtools-protocol@0.0.818844/types/protocol.d.ts"
);
const protocolMapping = await fetch(
  "https://unpkg.com/devtools-protocol@0.0.818844/types/protocol-mapping.d.ts"
);
const files: Record<string, Uint8Array> = {
  LICENSE: originalFiles.LICENSE,
  "vendor/devtools-protocol/types/protocol.d.ts": new Uint8Array(
    await protocolReq.arrayBuffer()
  ),
  "vendor/devtools-protocol/types/protocol-mapping.d.ts": encoder.encode(
    (await protocolMapping.text()).replace(`'./protocol'`, `'./protocol.d.ts'`)
  ),
};

for (const fileName in originalFiles) {
  if (fileName.startsWith("lib/esm/")) {
    files[fileName.substring("lib/esm/".length)] = originalFiles[fileName];
  }
}
for (const fileName in files) {
  if (
    fileName.startsWith("puppeteer/node") ||
    fileName.endsWith(".map") ||
    fileName.endsWith(".tsbuildinfo") ||
    fileName == "puppeteer/initialize-node.js"
  ) {
    delete files[fileName];
  }
}

for (const fileName in files) {
  // add <references> to js files
  if (fileName.endsWith(".js")) {
    const src = decoder.decode(files[fileName]);
    const base = basename(fileName, ".js");
    files[fileName] = encoder.encode(
      `/// <reference types="./${base}.d.ts" />\n` +
        src.replaceAll(
          "'devtools-protocol'",
          "'../../vendor/devtools-protocol/types/protocol.d.ts'"
        )
    );
  }
  if (fileName.endsWith(".d.ts")) {
    const src = decoder.decode(files[fileName]);
    const base = basename(fileName, ".d.ts");
    files[fileName] = encoder.encode(
      src
        .replace(`//# sourceMappingURL=${base}.d.ts.map`, "")
        .replace(`/// <reference types="node" />\n`, "")
        .replaceAll(
          "'devtools-protocol'",
          "'../../vendor/devtools-protocol/types/protocol.d.ts'"
        )
        .replaceAll(
          "'devtools-protocol/types/protocol-mapping.js'",
          "'../../vendor/devtools-protocol/types/protocol-mapping.d.ts'"
        )
        .replaceAll(" Element ", " any ")
        .replaceAll(" Element ", " any ")
        .replaceAll(" Element[", " any[")
        .replaceAll(" Element,", " any,")
        .replaceAll("Element>", "any>")
        .replaceAll("| Document", "")
        .replaceAll("| NodeListOf<any>", "")
        .replaceAll("NodeJS.Timeout", "number")
    );
  }
}

{
  const fileName = "puppeteer/api-docs-entry.js";
  const src = decoder.decode(files[fileName]);
  files[fileName] = encoder.encode(
    src
      .split("\n")
      .filter((l) => !l.includes("./node/"))
      .join("\n")
      .replace(
        "'devtools-protocol/types/protocol'",
        "'../vendor/devtools-protocol/types/protocol.d.ts'"
      )
  );
}
{
  const fileName = "puppeteer/api-docs-entry.d.ts";
  const src = decoder.decode(files[fileName]);
  files[fileName] = encoder.encode(
    src
      .split("\n")
      .filter((l) => !l.includes("./node/"))
      .join("\n")
      .replace(
        "'devtools-protocol/types/protocol'",
        "'../vendor/devtools-protocol/types/protocol.d.ts'"
      )
  );
}

{
  const fileName = "puppeteer/common/Browser.d.ts";
  const src = decoder.decode(files[fileName]);
  files[fileName] = encoder.encode(
    src.replace(
      `import { ChildProcess } from 'child_process';\n`,
      `/** ChildProcess is not supported in Deno. Please ignore. */\ntype ChildProcess = void;\n`
    )
  );
}

[
  "puppeteer/common/Product.js",
  "puppeteer/common/PuppeteerViewport.js",
  "puppeteer/common/EvalTypes.js",
  "puppeteer/common/ConnectionTransport.js",
].forEach((fileName) => {
  const src = decoder.decode(files[fileName]);
  files[fileName] = encoder.encode(src + "\nexport {};");
});

const output = `./vendor/puppeteer-core`;

await Deno.remove(output, { recursive: true }).catch(() => {});
await Deno.mkdir(output, { recursive: true });

const filenames = [];

for (const filename in files) {
  const path = `${output}/${filename}`;
  filenames.push(path);
  await Deno.mkdir(dirname(path), { recursive: true });
  await Deno.writeFile(path, files[filename]);
}

const cmd = Deno.run({
  cmd: [
    "deno",
    "fmt",
    ...filenames.filter((f) => f.endsWith(".js") || f.endsWith(".d.ts")),
  ],
});
await cmd.status();
