import express, { Request, Response, Router } from "express";

import { db } from "@/database";

const router: Router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  const posts = await db.query.postsTable.findMany();
  res.json(posts);
});

export default router;
