import express from "express";
import productRouter from "./routes/product.routes.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requestId } from "./middleware/requestId.js";

const app = express();

app.use(requestId);
app.use(requestLogger);
app.use(express.json());

app.use("/api/products", productRouter);

app.use("/boom", (req, res) => {
  throw new Error("Kaboom!");
});

app.use(notFoundHandler);
app.use(errorHandler);

app.get("/test", (_req, res) => {
  res.json({ message: "server is working" });
});

const PORT = Number(process.env.PORT ?? "5000");

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
