import { commentSchema } from "@advanced-react/shared/schema/comment";
import { experienceSchema } from "@advanced-react/shared/schema/experience";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "../../database";
import { publicProcedure, router } from "../../trpc";
import { commentsTable } from "./models";

export const commentRouter = router({
  byExperienceId: publicProcedure
    .input(
      z.object({
        experienceId: experienceSchema.shape.id,
      }),
    )
    .query(async ({ input }) => {
      const comments = await db.query.commentsTable.findMany({
        where: eq(commentsTable.experienceId, input.experienceId),
        orderBy: desc(commentsTable.createdAt),
      });

      return comments;
    }),

  add: publicProcedure
    .input(
      z.object({
        experienceId: experienceSchema.shape.id,
        content: commentSchema.shape.content,
      }),
    )
    .mutation(async ({ input }) => {
      const now = new Date().toISOString();

      const comment = await db
        .insert(commentsTable)
        .values({
          experienceId: input.experienceId,
          content: input.content,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return comment[0];
    }),

  edit: publicProcedure.input(commentSchema).mutation(async ({ input }) => {
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

  delete: publicProcedure
    .input(z.object({ id: commentSchema.shape.id }))
    .mutation(async ({ input }) => {
      await db.delete(commentsTable).where(eq(commentsTable.id, input.id));
      return input.id;
    }),
});
