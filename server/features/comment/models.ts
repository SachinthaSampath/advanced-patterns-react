import { index, int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { usersTable } from "../auth/models";
import { experiencesTable } from "../experience/models";

export const commentsTable = sqliteTable(
  "comments",
  {
    id: int("id").primaryKey({ autoIncrement: true }),
    content: text("content").notNull(),

    experienceId: int("experience_id")
      .notNull()
      .references(() => experiencesTable.id, { onDelete: "cascade" }),
    userId: int("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),

    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    comments_experience_id_idx: index("comments_experience_id_idx").on(
      table.experienceId,
    ),
  }),
);

export const commentSelectSchema = createSelectSchema(commentsTable);
export const commentInsertSchema = createInsertSchema(commentsTable);

export type Comment = typeof commentsTable.$inferSelect;
