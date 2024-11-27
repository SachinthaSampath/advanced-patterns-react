import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "../../database";
import { publicProcedure, router } from "../../trpc";
import { commentsTable } from "./models";

export const commentRouter = router({
  byPostId: publicProcedure
    .input(
      z.object({
        postId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const comments = await db.query.commentsTable.findMany({
        where: (comments, { eq }) => eq(comments.postId, input.postId),
        orderBy: (comments, { desc }) => [desc(comments.createdAt)],
        with: {
          post: true,
        },
      });
      return comments;
    }),

  add: publicProcedure
    .input(
      z.object({
        postId: z.number(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const now = new Date().toISOString();
      const comment = await db
        .insert(commentsTable)
        .values({
          postId: input.postId,
          content: input.content,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      return comment[0];
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(commentsTable).where(eq(commentsTable.id, input.id));
      return input.id;
    }),

  edit: publicProcedure
    .input(
      z.object({
        id: z.number(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const now = new Date().toISOString();
      const comment = await db
        .update(commentsTable)
        .set({
          content: input.content,
          updatedAt: now,
        })
        .where(eq(commentsTable.id, input.id))
        .returning();
      return comment[0];
    }),
});
