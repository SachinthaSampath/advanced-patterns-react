import { relations } from "drizzle-orm";

import { commentsTable } from "../features/comment/models";
import { experiencesTable } from "../features/experience/models";

export const experiencesRelations = relations(experiencesTable, ({ many }) => ({
  comments: many(commentsTable),
}));

export const commentsRelations = relations(commentsTable, ({ one }) => ({
  experience: one(experiencesTable, {
    fields: [commentsTable.experienceId],
    references: [experiencesTable.id],
  }),
}));
