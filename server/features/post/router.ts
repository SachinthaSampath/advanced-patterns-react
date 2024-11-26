import { db } from "../../database";
import { publicProcedure, router } from "../../trpc";

export const postRouter = router({
  list: publicProcedure.query(async () => {
    const posts = await db.query.postsTable.findMany();
    return posts;
  }),
});
