import {
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { usersTable } from "../auth/models";
import { experiencesTable } from "../experience/models";

export const commentsTable = pgTable(
  "comments",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    content: text("content").notNull(),

    experienceId: integer("experience_id")
      .notNull()
      .references(() => experiencesTable.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
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

export const commentLikesTable = pgTable(
  "comment_likes",
  {
    commentId: integer("comment_id")
      .notNull()
      .references(() => commentsTable.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
  },
  (table) => ({
    comment_likes_pk: primaryKey({
      columns: [table.commentId, table.userId],
    }),
    comment_likes_comment_id_idx: index("comment_likes_comment_id_idx").on(
      table.commentId,
    ),
    comment_likes_user_id_idx: index("comment_likes_user_id_idx").on(
      table.userId,
    ),
  }),
);

export const commentLikeSelectSchema = createSelectSchema(commentLikesTable);
export type CommentLike = typeof commentLikesTable.$inferSelect;
