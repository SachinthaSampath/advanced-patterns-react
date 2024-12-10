import { index, int, sqliteTable, text } from "drizzle-orm/sqlite-core";
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
