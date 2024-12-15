import { relations } from "drizzle-orm";

import {
  commentsTable,
  experienceAttendeesTable,
  experiencesTable,
  usersTable,
} from "./schema";

export const experiencesRelations = relations(
  experiencesTable,
  ({ many, one }) => ({
    comments: many(commentsTable),
    user: one(usersTable, {
      fields: [experiencesTable.userId],
      references: [usersTable.id],
    }),
    attendees: many(experienceAttendeesTable),
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

export const experienceAttendeesRelations = relations(
  experienceAttendeesTable,
  ({ one }) => ({
    experience: one(experiencesTable, {
      fields: [experienceAttendeesTable.experienceId],
      references: [experiencesTable.id],
    }),
    user: one(usersTable, {
      fields: [experienceAttendeesTable.userId],
      references: [usersTable.id],
    }),
  }),
);
