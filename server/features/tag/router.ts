import { TRPCError } from "@trpc/server";
import { count, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "../../database";
import { tagsTable } from "../../database/schema";
import { publicProcedure, router } from "../../trpc";
import { DEFAULT_EXPERIENCE_LIMIT } from "../../utils/constants";
import { cleanUserSelectSchema } from "../auth/models";
import { commentsTable } from "../comment/models";
import {
  experienceAttendeesTable,
  experienceSelectSchema,
  experiencesTable,
  experienceTagsTable,
} from "../experience/models";
import { tagSelectSchema } from "./models";

export const tagRouter = router({
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .output(tagSelectSchema)
    .query(async ({ input }) => {
      const tag = await db.query.tagsTable.findFirst({
        where: eq(tagsTable.id, input.id),
      });

      if (!tag) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tag not found" });
      }

      return tag;
    }),
  experiences: publicProcedure
    .input(
      z.object({
        id: z.number(),
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
            tags: z.array(tagSelectSchema),
          }),
        ),
        nextCursor: z.number().optional(),
      }),
    )
    .query(async ({ input }) => {
      const limit = input.limit ?? DEFAULT_EXPERIENCE_LIMIT;
      const cursor = input.cursor ?? 0;

      // First get all experience IDs that have this tag
      const taggedExperiences = await db
        .select({ experienceId: experienceTagsTable.experienceId })
        .from(experienceTagsTable)
        .where(eq(experienceTagsTable.tagId, input.id));

      const experienceIds = taggedExperiences.map((e) => e.experienceId);

      if (experienceIds.length === 0) {
        return {
          experiences: [],
          nextCursor: undefined,
        };
      }

      const experiences = await db.query.experiencesTable.findMany({
        limit,
        offset: cursor,
        where: inArray(experiencesTable.id, experienceIds),
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
        experiences: experiences.map((experience, i) => ({
          ...experience,
          commentsCount: counts[i][0].count,
          attendeesCount: attendeeCounts[i][0][0].count,
          attendees: attendeeCounts[i][1].map((a) => a.user),
          tags: tagResults[i].map((t) => t.tag),
        })),
        nextCursor: experiences.length === limit ? cursor + limit : undefined,
      };
    }),
});
