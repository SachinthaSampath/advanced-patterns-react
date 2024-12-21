import { TRPCError } from "@trpc/server";
import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "../../database";
import {
  commentsTable,
  experienceAttendeesTable,
  experienceSelectSchema,
  experiencesTable,
  userFollowsTable,
} from "../../database/schema";
import { protectedProcedure, publicProcedure, router } from "../../trpc";
import { DEFAULT_EXPERIENCE_LIMIT } from "../../utils/constants";
import { cleanUserSelectSchema, usersTable } from "../auth/models";

export const userRouter = router({
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .output(
      cleanUserSelectSchema.extend({
        followersCount: z.number(),
        isFollowing: z.boolean(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, input.id),
        columns: {
          id: true,
          name: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const [followersCount] = await db
        .select({ count: count() })
        .from(userFollowsTable)
        .where(eq(userFollowsTable.followingId, input.id));

      const isFollowing = ctx.user
        ? await db.query.userFollowsTable
            .findFirst({
              where: and(
                eq(userFollowsTable.followerId, ctx.user.id),
                eq(userFollowsTable.followingId, input.id),
              ),
            })
            .then(Boolean)
        : false;

      return {
        ...user,
        followersCount: followersCount?.count ?? 0,
        isFollowing,
      };
    }),

  experiences: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        cursor: z.number().optional(),
        limit: z.number().optional(),
      }),
    )
    .output(
      z.object({
        experiences: z.array(
          experienceSelectSchema.extend({
            commentsCount: z.number(),
            user: cleanUserSelectSchema,
            attendeesCount: z.number(),
            attendees: z.array(cleanUserSelectSchema),
          }),
        ),
        nextCursor: z.number().optional(),
      }),
    )
    .query(async ({ input }) => {
      const limit = input.limit ?? DEFAULT_EXPERIENCE_LIMIT;
      const cursor = input.cursor ?? 0;

      const experiences = await db.query.experiencesTable.findMany({
        limit,
        offset: cursor,
        where: eq(experiencesTable.userId, input.userId),
        orderBy: desc(experiencesTable.createdAt),
        with: {
          user: {
            columns: {
              password: false,
              email: false,
            },
          },
        },
      });

      const countQueries = experiences.map((experience) =>
        db
          .select({ count: count() })
          .from(commentsTable)
          .where(eq(commentsTable.experienceId, experience.id)),
      );

      const counts = await Promise.all(countQueries);

      const attendeeQueries = experiences.map((experience) =>
        Promise.all([
          db
            .select({ count: count() })
            .from(experienceAttendeesTable)
            .where(eq(experienceAttendeesTable.experienceId, experience.id)),
          db.query.experienceAttendeesTable.findMany({
            where: eq(experienceAttendeesTable.experienceId, experience.id),
            limit: 5,
            with: {
              user: {
                columns: {
                  email: false,
                  password: false,
                },
              },
            },
          }),
        ]),
      );

      const attendeeCounts = await Promise.all(attendeeQueries);

      const experiencesWithCounts = experiences.map((experience, i) => ({
        ...experience,
        commentsCount: counts[i][0].count,
        attendeesCount: attendeeCounts[i][0][0].count,
        attendees: attendeeCounts[i][1].map((a) => a.user),
      }));

      const nextCursor =
        experiences.length === limit ? cursor + limit : undefined;

      return {
        experiences: experiencesWithCounts,
        nextCursor,
      };
    }),

  follow: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot follow yourself",
        });
      }

      const existingFollow = await db.query.userFollowsTable.findFirst({
        where: and(
          eq(userFollowsTable.followerId, ctx.user.id),
          eq(userFollowsTable.followingId, input.userId),
        ),
      });

      if (existingFollow) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You are already following this user",
        });
      }

      await db.insert(userFollowsTable).values({
        followerId: ctx.user.id,
        followingId: input.userId,
        createdAt: new Date().toISOString(),
      });

      return { success: true };
    }),

  unfollow: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(userFollowsTable)
        .where(
          and(
            eq(userFollowsTable.followerId, ctx.user.id),
            eq(userFollowsTable.followingId, input.userId),
          ),
        );

      return { success: true };
    }),
});
