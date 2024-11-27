import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const experiencesTable = sqliteTable("experiences_table", {
  id: int().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  content: text().notNull(),
  createdAt: text().notNull(),
  updatedAt: text().notNull(),
});

export type Experience = typeof experiencesTable.$inferSelect;
