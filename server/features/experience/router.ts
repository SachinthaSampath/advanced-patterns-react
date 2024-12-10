import { experienceValidationSchema } from "@advanced-react/shared/schema/experience";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "../../database";
import {
  cleanUserSelectSchema,
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
        user: cleanUserSelectSchema,
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
          user: {
            columns: {
              password: false,
              email: false,
            },
          },
        },
      });

      return {
        experiences,
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

      const now = new Date().toISOString();

      const updatedExperience = await db
        .update(experiencesTable)
        .set({
          title: input.title,
          content: input.content,
          updatedAt: now,
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
});
