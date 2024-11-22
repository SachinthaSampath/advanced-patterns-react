import express, { Request, Response, Router } from "express";

const router: Router = express.Router();

const products = [
  { id: 1, name: "Laptop", price: 999.99 },
  { id: 2, name: "Smartphone", price: 499.99 },
  { id: 3, name: "Headphones", price: 99.99 },
];

router.get("/", (req: Request, res: Response) => {
  res.json(products);
});

export default router;
