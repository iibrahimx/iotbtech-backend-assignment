import { createReadStream, createWriteStream, statSync } from "node:fs";
import { pipeline } from "node:stream/promises";

async function copyFile(source: string, destination: string): Promise<void> {
  const readable = createReadStream(source);
  const writable = createWriteStream(destination);

  await pipeline(readable, writable);
}

async function main(): Promise<void> {
  const source = "data/products.csv";
  const destination = "data/products-backup.csv";

  const start = performance.now();

  await copyFile(source, destination);

  const sourceSize = statSync(source).size;
  const destSize = statSync(destination).size;

  const elapsed = (performance.now() - start).toFixed(1);

  console.log(`Copied ${source} → ${destination}`);
  console.log(`Source size: ${sourceSize} bytes`);
  console.log(`Dest size:   ${destSize} bytes`);
  console.log(`Sizes match: ${sourceSize === destSize}`);
  console.log(`Took ${elapsed} ms`);
}

main();