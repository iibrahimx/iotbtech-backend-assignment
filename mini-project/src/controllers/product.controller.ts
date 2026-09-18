import type { Request, Response } from "express";
import {
  findAllProducts,
  findProductById,
  createProduct as createProductService,
  updateProduct as updateProductService,
  deleteProduct as deleteProductService,
} from "../services/product.service.js";

export function getAllProducts(req: Request, res: Response): void {
  const category = req.query.category;

  if (typeof category === "string") {
    const filtered = findAllProducts().filter((p) => p.category === category);
    res.json(filtered);
    return;
  }

  res.json(findAllProducts());
}

export function getProductById(req: Request, res: Response): void {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid product ID" });
    return;
  }

  const product = findProductById(id);

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(product);
}

export function createProduct(req: Request, res: Response): void {
  const { name, price } = req.body as { name?: unknown; price?: unknown };

  if (typeof name !== "string" || typeof price !== "number") {
    res.status(400).json({ error: "name and price are required" });
    return;
  }

  const created = createProductService({
    name,
    category:
      typeof req.body.category === "string"
        ? req.body.category
        : "uncategorized",
    price,
    stock: typeof req.body.stock === "number" ? req.body.stock : 0,
  });

  res.status(201).json(created);
}

export function updateProduct(req: Request, res: Response): void {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid product ID" });
    return;
  }

  const updated = updateProductService(id, req.body);

  if (!updated) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(updated);
}

export function deleteProduct(req: Request, res: Response): void {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid product ID" });
    return;
  }

  const deleted = deleteProductService(id);

  if (!deleted) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json({ deleted: true, message: "Product deleted successfully", id });
}
