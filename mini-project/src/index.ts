import express from "express";
import productRouter from "./routes/product.routes.js";

const app = express();

app.use(express.json());

app.get("/test", (_req, res) => {
  res.json({ message: "server is working" });
});

app.use("/api/products", productRouter);

const PORT = Number(process.env.PORT ?? "5000");

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
