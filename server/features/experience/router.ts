import { experienceValidationSchema } from "@advanced-react/shared/schema/experience";
import { TRPCError } from "@trpc/server";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "../../database";
import {
  cleanUserSelectSchema,
  commentsTable,
  experienceAttendeesTable,
  experienceSelectSchema,
  experiencesTable,
} from "../../database/schema";
import { protectedProcedure, publicProcedure, router } from "../../trpc";
import { DEFAULT_EXPERIENCE_LIMIT } from "../../utils/constants";

export const experienceRouter = router({
  byId: publicProcedure
    .input(z.object({ id: experienceSelectSchema.shape.id }))
    .output(
      experienceSelectSchema.extend({
        commentsCount: z.number(),
        user: cleanUserSelectSchema,
        attendeesCount: z.number(),
        attendees: z.array(cleanUserSelectSchema),
      }),
    )
    .query(async ({ input }) => {
      const experience = await db.query.experiencesTable.findFirst({
        where: eq(experiencesTable.id, input.id),
        with: {
          user: {
            columns: {
              email: false,
              password: false,
            },
          },
        },
      });

      if (!experience) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Experience not found",
        });
      }

      const [commentCount] = await db
        .select({ count: count() })
        .from(commentsTable)
        .where(eq(commentsTable.experienceId, input.id));

      const [attendeesCount] = await db
        .select({ count: count() })
        .from(experienceAttendeesTable)
        .where(eq(experienceAttendeesTable.experienceId, input.id));

      const attendees = await db.query.experienceAttendeesTable.findMany({
        where: eq(experienceAttendeesTable.experienceId, input.id),
        limit: 5,
        with: {
          user: {
            columns: {
              email: false,
              password: false,
            },
          },
        },
      });

      return {
        ...experience,
        commentsCount: commentCount?.count ?? 0,
        attendeesCount: attendeesCount?.count ?? 0,
        attendees: attendees.map((a) => a.user),
      };
    }),

  feed: publicProcedure
    .input(
      z.object({
        limit: z.number().optional(),
        cursor: z.number().optional(),
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
      const limit = input?.limit ?? DEFAULT_EXPERIENCE_LIMIT;
      const cursor = input?.cursor ?? 0;

      const experiences = await db.query.experiencesTable.findMany({
        limit,
        offset: cursor,
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

      const attendeeResults = await Promise.all(attendeeQueries);

      const experiencesWithCounts = experiences.map((experience, index) => ({
        ...experience,
        commentsCount: counts[index][0]?.count ?? 0,
        attendeesCount: attendeeResults[index][0][0]?.count ?? 0,
        attendees: attendeeResults[index][1].map((a) => a.user),
      }));

      return {
        experiences: experiencesWithCounts,
        nextCursor: experiences.length === limit ? cursor + limit : undefined,
      };
    }),

  edit: protectedProcedure
    .input(
      z.object({
        id: experienceSelectSchema.shape.id,
        ...experienceValidationSchema.shape,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const experience = await db.query.experiencesTable.findFirst({
        where: eq(experiencesTable.id, input.id),
      });

      if (!experience) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Experience not found",
        });
      }

      if (experience.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own experiences",
        });
      }

      const updatedExperience = await db
        .update(experiencesTable)
        .set({
          title: input.title,
          content: input.content,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(experiencesTable.id, input.id))
        .returning();

      return updatedExperience[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: experienceSelectSchema.shape.id }))
    .mutation(async ({ ctx, input }) => {
      const experience = await db.query.experiencesTable.findFirst({
        where: eq(experiencesTable.id, input.id),
      });

      if (!experience) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Experience not found",
        });
      }

      if (experience.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own experiences",
        });
      }

      await db
        .delete(experiencesTable)
        .where(eq(experiencesTable.id, input.id));

      return input.id;
    }),

  getAttendees: publicProcedure
    .input(z.object({ id: experienceSelectSchema.shape.id }))
    .output(z.array(cleanUserSelectSchema))
    .query(async ({ input }) => {
      const attendees = await db.query.experienceAttendeesTable.findMany({
        where: eq(experienceAttendeesTable.experienceId, input.id),
        with: {
          user: {
            columns: {
              email: false,
              password: false,
            },
          },
        },
      });

      return attendees.map((attendee) => attendee.user);
    }),

  attend: protectedProcedure
    .input(z.object({ id: experienceSelectSchema.shape.id }))
    .mutation(async ({ ctx, input }) => {
      const experience = await db.query.experiencesTable.findFirst({
        where: eq(experiencesTable.id, input.id),
      });

      if (!experience) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Experience not found",
        });
      }

      const existingAttendee =
        await db.query.experienceAttendeesTable.findFirst({
          where: and(
            eq(experienceAttendeesTable.experienceId, input.id),
            eq(experienceAttendeesTable.userId, ctx.user.id),
          ),
        });

      if (existingAttendee) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You are already attending this experience",
        });
      }

      await db.insert(experienceAttendeesTable).values({
        experienceId: input.id,
        userId: ctx.user.id,
        createdAt: new Date().toISOString(),
      });

      return { success: true };
    }),

  unattend: protectedProcedure
    .input(z.object({ id: experienceSelectSchema.shape.id }))
    .mutation(async ({ ctx, input }) => {
      const experience = await db.query.experiencesTable.findFirst({
        where: eq(experiencesTable.id, input.id),
      });

      if (!experience) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Experience not found",
        });
      }

      await db
        .delete(experienceAttendeesTable)
        .where(
          and(
            eq(experienceAttendeesTable.experienceId, input.id),
            eq(experienceAttendeesTable.userId, ctx.user.id),
          ),
        );

      return { success: true };
    }),
});
