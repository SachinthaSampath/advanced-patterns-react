import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const commentsTable = sqliteTable("comments_table", {
  id: int().primaryKey({ autoIncrement: true }),
  content: text().notNull(),
  experienceId: int().notNull(),
  createdAt: text().notNull(),
  updatedAt: text().notNull(),
});

export type Comment = typeof commentsTable.$inferSelect;
