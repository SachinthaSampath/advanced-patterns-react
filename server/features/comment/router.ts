import { commentValidationSchema } from "@advanced-react/shared/schema/comment";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "../../database";
import {
  cleanUserSelectSchema,
  commentSelectSchema,
  commentsTable,
  experienceSelectSchema,
} from "../../database/schema";
import { publicProcedure, router } from "../../trpc";

export const commentRouter = router({
  byExperienceId: publicProcedure
    .input(
      z.object({
        experienceId: experienceSelectSchema.shape.id,
      }),
    )
    .query(async ({ input }) => {
      const comments = await db.query.commentsTable.findMany({
        where: eq(commentsTable.experienceId, input.experienceId),
        orderBy: desc(commentsTable.createdAt),
        with: {
          user: {
            columns: {
              password: false,
              email: false,
            },
          },
        },
      });

      return comments;
    }),

  add: publicProcedure
    .input(
      z.object({
        experienceId: experienceSelectSchema.shape.id,
        content: commentValidationSchema.shape.content,
        userId: cleanUserSelectSchema.shape.id,
      }),
    )
    .mutation(async ({ input }) => {
      const now = new Date().toISOString();

      const comment = await db
        .insert(commentsTable)
        .values({
          experienceId: input.experienceId,
          content: input.content,
          userId: input.userId,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return comment[0];
    }),

  edit: publicProcedure
    .input(
      z.object({
        id: commentSelectSchema.shape.id,
        ...commentValidationSchema.shape,
      }),
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

  delete: publicProcedure
    .input(z.object({ id: commentSelectSchema.shape.id }))
    .mutation(async ({ input }) => {
      await db.delete(commentsTable).where(eq(commentsTable.id, input.id));
      return input.id;
    }),
});
