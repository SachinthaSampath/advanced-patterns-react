import { relations } from "drizzle-orm";

import { commentsTable, usersTable } from "./schema";
import { experiencesTable } from "./schema";

export const experiencesRelations = relations(
  experiencesTable,
  ({ many, one }) => ({
    comments: many(commentsTable),
    user: one(usersTable, {
      fields: [experiencesTable.userId],
      references: [usersTable.id],
    }),
  }),
);

export const commentsRelations = relations(commentsTable, ({ one }) => ({
  experience: one(experiencesTable, {
    fields: [commentsTable.experienceId],
    references: [experiencesTable.id],
  }),
  user: one(usersTable, {
    fields: [commentsTable.userId],
    references: [usersTable.id],
  }),
}));
