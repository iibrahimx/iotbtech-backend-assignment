import { createReadStream, createWriteStream } from "node:fs";
import { createInterface } from "node:readline";

function parseLine(
  line: string,
): { price: number; stock: number; category: string } | null {
  const parts = line.split(",");
  if (parts.length !== 5) return null;

  const [, , category, price, stock] = parts;
  return {
    category,
    price: Number(price),
    stock: Number(stock),
  };
}

async function main(): Promise<void> {
  const start = performance.now();
  const inputPath = process.env.INPUT_FILE ?? "data/products.csv";
  const outputPath = process.env.OUT_FILE ?? "data/category-summary.csv";

  const byCategory = new Map<string, number>();
  let grandTotal = 0;
  let rowCount = 0;
  let isFirstLine = true;

  const inputStream = createReadStream(inputPath, { encoding: "utf8" });
  const lineReader = createInterface({
    input: inputStream,
    crlfDelay: Infinity,
  });

  for await (const line of lineReader) {
    if (isFirstLine) {
      isFirstLine = false;
      continue;
    }

    const parsed = parseLine(line);
    if (!parsed) continue;

    const { category, price, stock } = parsed;
    const total = price * stock;

    byCategory.set(category, (byCategory.get(category) ?? 0) + total);
    grandTotal += total;
    rowCount++;
  }

  const outputStream = createWriteStream(outputPath);
  outputStream.write("category,total\n");

  for (const [category, total] of byCategory) {
    outputStream.write(`${category},${total.toFixed(2)}\n`);
    console.log(`${category} → $${total.toFixed(2)}`);
  }

  outputStream.end();

  console.log(`Rows processed: ${rowCount}`);
  console.log(`Grand total: $${grandTotal.toFixed(2)}`);
  console.log(`Runtime: ${(performance.now() - start).toFixed(1)} ms`);
}

main();
