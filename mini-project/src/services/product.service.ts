import { readFileSync } from "node:fs";

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
}

function loadProductsFromCsv(path: string): Product[] {
  const content = readFileSync(path, "utf8");
  const lines = content.split("\n").filter((line) => line.trim() !== "");
  const dataLines = lines.slice(1);

  const products: Product[] = [];
  for (const line of dataLines) {
    const parts = line.split(",");
    if (parts.length !== 5) continue;

    const [idStr, name, category, priceStr, stockStr] = parts;
    products.push({
      id: Number(idStr),
      name,
      category,
      price: Number(priceStr),
      stock: Number(stockStr),
    });
  }

  return products;
}

const products: Product[] = loadProductsFromCsv("data/products.csv");
let nextId = products.length + 1;

export function findAllProducts(): Product[] {
  return products;
}

export function findProductById(id: number): Product | undefined {
  return products.find((product) => product.id === id);
}

export function createProduct(data: Omit<Product, "id">): Product {
  const product: Product = { id: nextId, ...data };
  nextId++;
  products.push(product);
  return product;
}

export function updateProduct(
  id: number,
  data: Partial<Omit<Product, "id">>,
): Product | null {
  const product = products.find((p) => p.id === id);
  if (!product) return null;

  Object.assign(product, data);
  return product;
}

export function deleteProduct(id: number): boolean {
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return false;

  products.splice(index, 1);
  return true;
}
