import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";

export const tagsTable = pgTable(
  "tags",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: text("name").notNull().unique(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
  },
  (table) => ({
    tags_name_idx: index("tags_name_idx").on(table.name),
  }),
);

export const tagSelectSchema = createSelectSchema(tagsTable);

export type Tag = typeof tagsTable.$inferSelect;
