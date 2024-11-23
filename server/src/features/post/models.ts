import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const postsTable = sqliteTable("posts_table", {
  id: int().primaryKey({ autoIncrement: true }),

  title: text().notNull(),
  content: text().notNull(),

  createdAt: text().notNull(),
  updatedAt: text().notNull(),
});
