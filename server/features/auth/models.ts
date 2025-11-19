import { integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  bio: text(),
  avatarUrl: text(),
  email: text().notNull().unique(),
  password: text().notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
});

export const userSelectSchema = createSelectSchema(usersTable);
export const cleanUserSelectSchema = userSelectSchema.omit({
  password: true,
  email: true,
});

export const userFollowsTable = pgTable(
  "user_follows",
  {
    followerId: integer("follower_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    followingId: integer("following_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.followerId, table.followingId] }),
  }),
);

type FullUser = typeof usersTable.$inferSelect;

export type CurrentUser = FullUser;

export type User = Omit<FullUser, "email" | "password">;
