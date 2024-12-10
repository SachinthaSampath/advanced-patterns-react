import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-zod";

export const usersTable = sqliteTable("users_table", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  avatarUrl: text(),
  email: text().notNull().unique(),
  password: text().notNull(),

  createdAt: text().notNull(),
  updatedAt: text().notNull(),
});

export const userSelectSchema = createSelectSchema(usersTable);
export const cleanUserSelectSchema = userSelectSchema.omit({
  password: true,
  email: true,
});

type FullUser = typeof usersTable.$inferSelect;

export type CurrentUser = FullUser;

export type User = Omit<FullUser, "email" | "password">;
