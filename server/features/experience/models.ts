import {
  index,
  int,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-zod";

import { usersTable } from "../auth/models";

export const experiencesTable = sqliteTable(
  "experiences_table",
  {
    id: int().primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    content: text("content").notNull(),

    userId: int("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),

    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    experiences_user_id_idx: index("experiences_user_id_idx").on(table.userId),
  }),
);

export const experienceSelectSchema = createSelectSchema(experiencesTable);

export type Experience = typeof experiencesTable.$inferSelect;

export const experienceAttendeesTable = sqliteTable(
  "experience_attendees_table",
  {
    experienceId: int("experience_id")
      .notNull()
      .references(() => experiencesTable.id, { onDelete: "cascade" }),
    userId: int("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    experience_attendees_pk: primaryKey({
      columns: [table.experienceId, table.userId],
    }),
    experience_attendees_experience_id_idx: index(
      "experience_attendees_experience_id_idx",
    ).on(table.experienceId),
    experience_attendees_user_id_idx: index(
      "experience_attendees_user_id_idx",
    ).on(table.userId),
  }),
);

export type ExperienceAttendee = typeof experienceAttendeesTable.$inferSelect;
