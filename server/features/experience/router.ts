import { experienceSchema } from "@advanced-react/shared/schema/experience";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "../../database";
import { publicProcedure, router } from "../../trpc";
import { DEFAULT_EXPERIENCE_LIMIT } from "../../utils/constants";
import { experiencesTable } from "./models";

export const experienceRouter = router({
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const experience = await db.query.experiencesTable.findFirst({
        where: (experiences, { eq }) => eq(experiences.id, input.id),
      });
      return experience;
    }),

  feed: publicProcedure
    .input(
      z.object({
        limit: z.number().optional(),
        cursor: z.number().optional(),
      }),
    )
    .query(async ({ input }) => {
      const limit = input?.limit ?? DEFAULT_EXPERIENCE_LIMIT;
      const cursor = input?.cursor ?? 0;

      const experiences = await db.query.experiencesTable.findMany({
        limit,
        offset: cursor,
        with: {
          comments: true,
        },
      });

      return {
        experiences,
        nextCursor: experiences.length === limit ? cursor + limit : undefined,
      };
    }),

  edit: publicProcedure
    .input(
      z.object({
        id: z.number(),
        ...experienceSchema.shape,
      }),
    )
    .mutation(async ({ input }) => {
      const now = new Date().toISOString();

      const experience = await db
        .update(experiencesTable)
        .set({
          title: input.title,
          content: input.content,
          updatedAt: now,
        })
        .where(eq(experiencesTable.id, input.id))
        .returning();

      return experience[0];
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db
        .delete(experiencesTable)
        .where(eq(experiencesTable.id, input.id));
      return input.id;
    }),
});
