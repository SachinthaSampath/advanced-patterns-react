import { commentValidationSchema } from "@advanced-react/shared/schema/comment";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "../../database";
import {
  commentLikesTable,
  commentSelectSchema,
  commentsTable,
  experienceSelectSchema,
  notificationsTable,
} from "../../database/schema";
import { protectedProcedure, publicProcedure, router } from "../../trpc";

export const commentRouter = router({
  byExperienceId: publicProcedure
    .input(
      z.object({
        experienceId: experienceSelectSchema.shape.id,
      }),
    )
    .query(async ({ ctx, input }) => {
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

      const likeQueries = comments.map((comment) =>
        ctx.user
          ? db.query.commentLikesTable.findFirst({
              where: and(
                eq(commentLikesTable.commentId, comment.id),
                eq(commentLikesTable.userId, ctx.user.id),
              ),
            })
          : Promise.resolve(null),
      );

      const likesCountQueries = comments.map((comment) =>
        db
          .select({ count: count() })
          .from(commentLikesTable)
          .where(eq(commentLikesTable.commentId, comment.id))
          .then((res) => res[0]?.count ?? 0),
      );

      const [likeResults, likesCountResults] = await Promise.all([
        Promise.all(likeQueries),
        Promise.all(likesCountQueries),
      ]);

      return comments.map((comment, index) => ({
        ...comment,
        isLiked: !!likeResults[index],
        likesCount: likesCountResults[index],
      }));
    }),

  add: protectedProcedure
    .input(
      z.object({
        experienceId: experienceSelectSchema.shape.id,
        content: commentValidationSchema.shape.content,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();

      const comment = await db
        .insert(commentsTable)
        .values({
          experienceId: input.experienceId,
          content: input.content,
          userId: ctx.user.id,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      await db.insert(notificationsTable).values({
        type: "user_commented_experience",
        commentId: comment[0].id,
        experienceId: input.experienceId,
        fromUserId: ctx.user.id,
        userId: comment[0].userId,
        createdAt: now,
      });

      return comment[0];
    }),

  edit: protectedProcedure
    .input(
      z.object({
        id: commentSelectSchema.shape.id,
        ...commentValidationSchema.shape,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await db.query.commentsTable.findFirst({
        where: eq(commentsTable.id, input.id),
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }

      if (comment.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own comments",
        });
      }

      const now = new Date().toISOString();

      const updatedComment = await db
        .update(commentsTable)
        .set({
          content: input.content,
          updatedAt: now,
        })
        .where(eq(commentsTable.id, input.id))
        .returning();

      return updatedComment[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: commentSelectSchema.shape.id }))
    .mutation(async ({ ctx, input }) => {
      const comment = await db.query.commentsTable.findFirst({
        where: eq(commentsTable.id, input.id),
      });

      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }

      if (comment.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own comments",
        });
      }

      await db.delete(commentsTable).where(eq(commentsTable.id, input.id));

      return input.id;
    }),

  like: protectedProcedure
    .input(z.object({ id: commentSelectSchema.shape.id }))
    .mutation(async ({ ctx, input }) => {
      const existingLike = await db.query.commentLikesTable.findFirst({
        where: and(
          eq(commentLikesTable.commentId, input.id),
          eq(commentLikesTable.userId, ctx.user.id),
        ),
      });

      if (existingLike) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Comment already liked",
        });
      }

      await db.insert(commentLikesTable).values({
        commentId: input.id,
        userId: ctx.user.id,
        createdAt: new Date().toISOString(),
      });

      return { success: true };
    }),

  unlike: protectedProcedure
    .input(z.object({ id: commentSelectSchema.shape.id }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(commentLikesTable)
        .where(
          and(
            eq(commentLikesTable.commentId, input.id),
            eq(commentLikesTable.userId, ctx.user.id),
          ),
        );

      return { success: true };
    }),
});
