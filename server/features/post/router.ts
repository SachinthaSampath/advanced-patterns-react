import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "../../database";
import { publicProcedure, router } from "../../trpc";
import { DEFAULT_POST_LIMIT } from "../../utils/constants";
import { postsTable } from "./models";

export const postRouter = router({
  feed: publicProcedure
    .input(
      z.object({
        limit: z.number().optional(),
        cursor: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const limit = input.limit ?? DEFAULT_POST_LIMIT;
      const cursor = input.cursor ?? 0;

      const posts = await db.query.postsTable.findMany({
        limit,
        offset: cursor,
        with: {
          comments: true,
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        posts,
        nextCursor: posts.length === limit ? cursor + limit : undefined,
      };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(postsTable).where(eq(postsTable.id, input.id));
      return input.id;
    }),

  edit: publicProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const now = new Date().toISOString();

      const post = await db
        .update(postsTable)
        .set({
          title: input.title,
          content: input.content,
          updatedAt: now,
        })
        .where(eq(postsTable.id, input.id))
        .returning();

      return post[0];
    }),
});
