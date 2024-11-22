import express, { Express, Request, Response } from "express";

import productsRouter from "./features/products/router";

const app: Express = express();
const port = process.env.PORT || 3000;

// JSON middleware
app.use(express.json());

// Add access control headers
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  next();
});

// Root route
app.get("/", (req: Request, res: Response) => {
  res.sendStatus(404);
});

// Routes
app.use("/api/products", productsRouter);

// Start server
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
