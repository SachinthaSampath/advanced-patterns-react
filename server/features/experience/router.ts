import {
  experienceFiltersSchema,
  experienceValidationSchema,
} from "@advanced-react/shared/schema/experience";
import { TRPCError } from "@trpc/server";
import { and, count, eq, gte, inArray, like } from "drizzle-orm";
import { z } from "zod";

import { db } from "../../database";
import {
  cleanUserSelectSchema,
  commentsTable,
  experienceAttendeesTable,
  experienceFavoritesTable,
  experienceSelectSchema,
  experiencesTable,
  experienceTagsTable,
  notificationsTable,
  tagSelectSchema,
  userFollowsTable,
} from "../../database/schema";
import { protectedProcedure, publicProcedure, router } from "../../trpc";
import { DEFAULT_EXPERIENCE_LIMIT } from "../../utils/constants";
import { writeFile } from "../../utils/files";

export const experienceRouter = router({
  byId: publicProcedure
    .input(z.object({ id: experienceSelectSchema.shape.id }))
    .output(
      experienceSelectSchema.extend({
        commentsCount: z.number(),
        user: cleanUserSelectSchema,
        attendeesCount: z.number(),
        attendees: z.array(cleanUserSelectSchema),
        tags: z.array(tagSelectSchema),
        isFavorited: z.boolean(),
      }),
    )
    .query(async ({ ctx, input }) => {
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

      const currentUserAttendance = ctx.user
        ? await db.query.experienceAttendeesTable.findFirst({
            where: and(
              eq(experienceAttendeesTable.experienceId, input.id),
              eq(experienceAttendeesTable.userId, ctx.user.id),
            ),
          })
        : null;

      const experienceTags = await db.query.experienceTagsTable.findMany({
        where: eq(experienceTagsTable.experienceId, input.id),
        with: {
          tag: true,
        },
      });

      const isFavorited = ctx.user
        ? await db.query.experienceFavoritesTable.findFirst({
            where: and(
              eq(experienceFavoritesTable.experienceId, input.id),
              eq(experienceFavoritesTable.userId, ctx.user.id),
            ),
          })
        : null;

      return {
        ...experience,
        commentsCount: commentCount?.count ?? 0,
        attendeesCount: attendeesCount?.count ?? 0,
        attendees: [
          ...(currentUserAttendance && ctx.user ? [ctx.user] : []),
          ...attendees.map((a) => a.user),
        ],
        tags: experienceTags.map((et) => et.tag),
        isFavorited: !!isFavorited,
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
            tags: z.array(tagSelectSchema),
            isFavorited: z.boolean(),
          }),
        ),
        nextCursor: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
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
          ctx.user
            ? db.query.experienceAttendeesTable.findFirst({
                where: and(
                  eq(experienceAttendeesTable.experienceId, experience.id),
                  eq(experienceAttendeesTable.userId, ctx.user.id),
                ),
              })
            : undefined,
        ]),
      );

      const attendeeResults = await Promise.all(attendeeQueries);

      const tagQueries = experiences.map((experience) =>
        db.query.experienceTagsTable.findMany({
          where: eq(experienceTagsTable.experienceId, experience.id),
          with: {
            tag: true,
          },
        }),
      );

      const tagResults = await Promise.all(tagQueries);

      const favoriteQueries = experiences.map((experience) =>
        ctx.user
          ? db.query.experienceFavoritesTable.findFirst({
              where: and(
                eq(experienceFavoritesTable.experienceId, experience.id),
                eq(experienceFavoritesTable.userId, ctx.user.id),
              ),
            })
          : Promise.resolve(null),
      );

      const favoriteResults = await Promise.all(favoriteQueries);

      return {
        experiences: experiences.map((experience, index) => ({
          ...experience,
          commentsCount: counts[index][0]?.count ?? 0,
          attendeesCount: attendeeResults[index][0][0]?.count ?? 0,
          attendees: [
            ...(attendeeResults[index][2] && ctx.user ? [ctx.user] : []),
            ...attendeeResults[index][1].map((a) => a.user),
          ],
          tags: tagResults[index].map((t) => t.tag),
          isFavorited: !!favoriteResults[index],
        })),
        nextCursor: experiences.length === limit ? cursor + limit : undefined,
      };
    }),

  search: publicProcedure
    .input(
      z
        .object({
          limit: z.number().optional(),
          cursor: z.number().optional(),
        })
        .merge(experienceFiltersSchema),
    )
    .output(
      z.object({
        experiences: z.array(
          experienceSelectSchema.extend({
            commentsCount: z.number(),
            user: cleanUserSelectSchema,
            attendeesCount: z.number(),
            attendees: z.array(cleanUserSelectSchema),
            tags: z.array(tagSelectSchema),
            isFavorited: z.boolean(),
          }),
        ),
        nextCursor: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? DEFAULT_EXPERIENCE_LIMIT;
      const cursor = input.cursor ?? 0;

      const whereConditions = [];

      if (input.q) {
        whereConditions.push(like(experiencesTable.title, `%${input.q}%`));
      }

      if (input.scheduledAt) {
        whereConditions.push(
          gte(experiencesTable.scheduledAt, input.scheduledAt),
        );
      }

      if (input.tags?.length) {
        const taggedExperiences = await db
          .select({ experienceId: experienceTagsTable.experienceId })
          .from(experienceTagsTable)
          .where(inArray(experienceTagsTable.tagId, input.tags));

        const experienceIds = taggedExperiences.map((e) => e.experienceId);

        whereConditions.push(inArray(experiencesTable.id, experienceIds));
      }

      const experiences = await db.query.experiencesTable.findMany({
        limit,
        offset: cursor,
        where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
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
          ctx.user
            ? db.query.experienceAttendeesTable.findFirst({
                where: and(
                  eq(experienceAttendeesTable.experienceId, experience.id),
                  eq(experienceAttendeesTable.userId, ctx.user.id),
                ),
              })
            : undefined,
        ]),
      );

      const attendeeResults = await Promise.all(attendeeQueries);

      const tagQueries = experiences.map((experience) =>
        db.query.experienceTagsTable.findMany({
          where: eq(experienceTagsTable.experienceId, experience.id),
          with: {
            tag: true,
          },
        }),
      );

      const tagResults = await Promise.all(tagQueries);

      const favoriteQueries = experiences.map((experience) =>
        ctx.user
          ? db.query.experienceFavoritesTable.findFirst({
              where: and(
                eq(experienceFavoritesTable.experienceId, experience.id),
                eq(experienceFavoritesTable.userId, ctx.user.id),
              ),
            })
          : Promise.resolve(null),
      );

      const favoriteResults = await Promise.all(favoriteQueries);

      return {
        experiences: experiences.map((experience, index) => ({
          ...experience,
          commentsCount: counts[index][0]?.count ?? 0,
          attendeesCount: attendeeResults[index][0][0]?.count ?? 0,
          attendees: [
            ...(attendeeResults[index][2] && ctx.user ? [ctx.user] : []),
            ...attendeeResults[index][1].map((a) => a.user),
          ],
          tags: tagResults[index].map((t) => t.tag),
          isFavorited: !!favoriteResults[index],
        })),
        nextCursor: experiences.length === limit ? cursor + limit : undefined,
      };
    }),

  add: protectedProcedure
    .input(experienceValidationSchema)
    .mutation(async ({ ctx, input }) => {
      let imagePath = null;
      if (input.image) {
        imagePath = await writeFile(input.image);
      }

      return await db
        .insert(experiencesTable)
        .values({
          title: input.title,
          content: input.content,
          scheduledAt: input.scheduledAt,
          url: input.url,
          imageUrl: imagePath,
          location: JSON.stringify(input.location),
          userId: ctx.user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();
    }),

  edit: protectedProcedure
    .input(experienceValidationSchema)
    .mutation(async ({ ctx, input }) => {
      if (!input.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Experience ID is required",
        });
      }

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

      let imagePath = experience.imageUrl;
      if (input.image) {
        imagePath = await writeFile(input.image);
      }

      return await db
        .update(experiencesTable)
        .set({
          title: input.title,
          content: input.content,
          scheduledAt: input.scheduledAt,
          url: input.url,
          imageUrl: imagePath,
          location: JSON.stringify(input.location),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(experiencesTable.id, input.id))
        .returning();
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

      await db.insert(notificationsTable).values({
        type: "user_attending_experience",
        experienceId: input.id,
        fromUserId: ctx.user.id,
        userId: experience.userId,
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

      await db.insert(notificationsTable).values({
        type: "user_unattending_experience",
        experienceId: input.id,
        fromUserId: ctx.user.id,
        userId: experience.userId,
        createdAt: new Date().toISOString(),
      });

      return { success: true };
    }),

  attendees: publicProcedure
    .input(
      z.object({
        experienceId: experienceSelectSchema.shape.id,
        limit: z.number().optional(),
        cursor: z.number().optional(),
      }),
    )
    .output(
      z.object({
        attendees: z.array(
          cleanUserSelectSchema.extend({
            isFollowing: z.boolean(),
            followersCount: z.number(),
            followingCount: z.number(),
          }),
        ),
        attendeesCount: z.number(),
        nextCursor: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? DEFAULT_EXPERIENCE_LIMIT;
      const cursor = input.cursor ?? 0;

      const [attendeesCount] = await db
        .select({ count: count() })
        .from(experienceAttendeesTable)
        .where(eq(experienceAttendeesTable.experienceId, input.experienceId));

      const attendees = await db.query.experienceAttendeesTable.findMany({
        where: eq(experienceAttendeesTable.experienceId, input.experienceId),
        limit,
        offset: cursor,
        with: {
          user: true,
        },
      });

      const attendeeFollowQueries = attendees.map((attendee) =>
        ctx.user
          ? db.query.userFollowsTable
              .findFirst({
                where: and(
                  eq(userFollowsTable.followerId, ctx.user.id),
                  eq(userFollowsTable.followingId, attendee.user.id),
                ),
              })
              .then(Boolean)
          : false,
      );

      const attendeeFollowResults = await Promise.all(attendeeFollowQueries);

      const attendeeFollowCountQueries = attendees.map((attendee) =>
        Promise.all([
          db
            .select({ count: count() })
            .from(userFollowsTable)
            .where(eq(userFollowsTable.followingId, attendee.user.id))
            .then((res) => res[0]?.count ?? 0),
          db
            .select({ count: count() })
            .from(userFollowsTable)
            .where(eq(userFollowsTable.followerId, attendee.user.id))
            .then((res) => res[0]?.count ?? 0),
        ]),
      );

      const attendeeFollowCounts = await Promise.all(
        attendeeFollowCountQueries,
      );

      return {
        attendees: attendees.map((attendee, index) => ({
          ...attendee.user,
          isFollowing: attendeeFollowResults[index],
          followersCount: attendeeFollowCounts[index][0],
          followingCount: attendeeFollowCounts[index][1],
        })),
        attendeesCount: attendeesCount?.count ?? 0,
        nextCursor: attendees.length === limit ? cursor + limit : undefined,
      };
    }),

  kickAttendee: protectedProcedure
    .input(
      z.object({
        experienceId: experienceSelectSchema.shape.id,
        userId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const experience = await db.query.experiencesTable.findFirst({
        where: eq(experiencesTable.id, input.experienceId),
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
          message: "Only the experience owner can kick attendees",
        });
      }

      if (experience.userId === input.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot kick the experience owner",
        });
      }

      await db
        .delete(experienceAttendeesTable)
        .where(
          and(
            eq(experienceAttendeesTable.experienceId, input.experienceId),
            eq(experienceAttendeesTable.userId, input.userId),
          ),
        );

      await db.insert(notificationsTable).values({
        type: "user_kicked_experience",
        experienceId: input.experienceId,
        fromUserId: ctx.user.id,
        userId: input.userId,
        createdAt: new Date().toISOString(),
      });

      return { success: true };
    }),

  favorite: protectedProcedure
    .input(z.object({ id: experienceSelectSchema.shape.id }))
    .mutation(async ({ ctx, input }) => {
      const existingFavorite =
        await db.query.experienceFavoritesTable.findFirst({
          where: and(
            eq(experienceFavoritesTable.experienceId, input.id),
            eq(experienceFavoritesTable.userId, ctx.user.id),
          ),
        });

      if (existingFavorite) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Experience already favorited",
        });
      }

      await db.insert(experienceFavoritesTable).values({
        experienceId: input.id,
        userId: ctx.user.id,
        createdAt: new Date().toISOString(),
      });

      return { success: true };
    }),

  unfavorite: protectedProcedure
    .input(z.object({ id: experienceSelectSchema.shape.id }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(experienceFavoritesTable)
        .where(
          and(
            eq(experienceFavoritesTable.experienceId, input.id),
            eq(experienceFavoritesTable.userId, ctx.user.id),
          ),
        );

      return { success: true };
    }),

  favorites: protectedProcedure
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
            tags: z.array(tagSelectSchema),
            isFavorited: z.boolean(),
          }),
        ),
        nextCursor: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? DEFAULT_EXPERIENCE_LIMIT;
      const cursor = input?.cursor ?? 0;

      const favorites = await db.query.experienceFavoritesTable.findMany({
        where: eq(experienceFavoritesTable.userId, ctx.user.id),
        limit,
        offset: cursor,
        with: {
          experience: {
            with: {
              user: {
                columns: {
                  password: false,
                  email: false,
                },
              },
            },
          },
        },
      });

      const experiences = favorites.map((f) => f.experience);

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
          ctx.user
            ? db.query.experienceAttendeesTable.findFirst({
                where: and(
                  eq(experienceAttendeesTable.experienceId, experience.id),
                  eq(experienceAttendeesTable.userId, ctx.user.id),
                ),
              })
            : undefined,
        ]),
      );

      const attendeeResults = await Promise.all(attendeeQueries);

      const tagQueries = experiences.map((experience) =>
        db.query.experienceTagsTable.findMany({
          where: eq(experienceTagsTable.experienceId, experience.id),
          with: {
            tag: true,
          },
        }),
      );

      const tagResults = await Promise.all(tagQueries);

      return {
        experiences: experiences.map((experience, index) => ({
          ...experience,
          commentsCount: counts[index][0]?.count ?? 0,
          attendeesCount: attendeeResults[index][0][0]?.count ?? 0,
          attendees: [
            ...(attendeeResults[index][2] && ctx.user ? [ctx.user] : []),
            ...attendeeResults[index][1].map((a) => a.user),
          ],
          tags: tagResults[index].map((t) => t.tag),
          isFavorited: true,
        })),
        nextCursor: experiences.length === limit ? cursor + limit : undefined,
      };
    }),
});
