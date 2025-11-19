import { boolean, index, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";

import { usersTable } from "../auth/models";
import { commentsTable } from "../comment/models";
import { experiencesTable } from "../experience/models";

export const notificationTypeEnum = pgEnum("notification_type", [
  "user_attending_experience",
  "user_unattending_experience",
  "user_commented_experience",
  "user_followed_user",
  "user_kicked_experience",
]);

export const notificationsTable = pgTable(
  "notifications",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    type: notificationTypeEnum("type").notNull(),
    read: boolean("read").notNull().default(false),

    commentId: integer("comment_id").references(() => commentsTable.id, {
      onDelete: "cascade",
    }),
    experienceId: integer("experience_id").references(() => experiencesTable.id, {
      onDelete: "cascade",
    }),
    fromUserId: integer("from_user_id")
      .notNull()
      .references(() => usersTable.id, {
        onDelete: "cascade",
      }),
    userId: integer("user_id").references(() => usersTable.id, {
      onDelete: "cascade",
    }),

    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
  },
  (table) => ({
    notifications_experience_id_idx: index(
      "notifications_experience_id_idx",
    ).on(table.experienceId),
    notifications_comment_id_idx: index("notifications_comment_id_idx").on(
      table.commentId,
    ),
    notifications_from_user_id_idx: index("notifications_from_user_id_idx").on(
      table.fromUserId,
    ),
    notifications_user_id_idx: index("notifications_user_id_idx").on(
      table.userId,
    ),
  }),
);

export const notificationSelectSchema = createSelectSchema(notificationsTable);

export type Notification = typeof notificationsTable.$inferSelect;
