import { mkdirSync, writeFileSync } from "node:fs";

const categories = [
  "electronics",
  "clothing",
  "books",
  "home",
  "toys",
  "food",
] as const;

function generatePrice(): number {
  return Math.round(Math.random() * 9900 + 100) / 100;
}

function generateStock(): number {
  return Math.floor(Math.random() * 501);
}

function generateRows(rowCount: number): string[] {
  const header = "id,name,category,price,stock";
  const rows: string[] = [header];

  for (let id = 1; id <= rowCount; id++) {
    const category = categories[id % categories.length];
    const name = `${category}-${id}`;
    const price = generatePrice();
    const stock = generateStock();
    rows.push(`${id},${name},${category},${price.toFixed(2)},${stock}`);
  }

  return rows;
}

function main(): void {
  const rowCount = Number(process.env.ROWS ?? "10000");
  const rows = generateRows(rowCount);

  mkdirSync("data", { recursive: true });
  writeFileSync("data/products.csv", rows.join("\n"));

  console.log(`Generated ${rowCount} rows -> data/products.csv`);
}

main();
