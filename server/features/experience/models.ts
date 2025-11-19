import {
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";

import { usersTable } from "../auth/models";
import { tagsTable } from "../tag/models";

export const experiencesTable = pgTable(
  "experiences",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    scheduledAt: timestamp("scheduled_at", { mode: "string" }).notNull(),
    url: text("url"),
    imageUrl: text("image_url"),
    location: text("location"),

    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
  },
  (table) => ({
    experiences_user_id_idx: index("experiences_user_id_idx").on(table.userId),
  }),
);

export const experienceSelectSchema = createSelectSchema(experiencesTable);

export type Experience = typeof experiencesTable.$inferSelect;

export const experienceAttendeesTable = pgTable(
  "experience_attendees",
  {
    experienceId: integer("experience_id")
      .notNull()
      .references(() => experiencesTable.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
  },
  (table) => ({
    experience_attendees_pk: primaryKey({
      columns: [table.experienceId, table.userId],
    }),
    experience_attendees_experience_id_idx: index(
      "experience_attendees_experience_id_idx",
    ).on(table.experienceId),
    experience_attendees_user_id_idx: index(
      "experience_attendees_user_id_idx",
    ).on(table.userId),
  }),
);

export type ExperienceAttendee = typeof experienceAttendeesTable.$inferSelect;

export const experienceTagsTable = pgTable(
  "experience_tags",
  {
    experienceId: integer("experience_id")
      .notNull()
      .references(() => experiencesTable.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tagsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
  },
  (table) => ({
    experience_tags_pk: primaryKey({
      columns: [table.experienceId, table.tagId],
    }),
    experience_tags_experience_id_idx: index(
      "experience_tags_experience_id_idx",
    ).on(table.experienceId),
    experience_tags_tag_id_idx: index("experience_tags_tag_id_idx").on(
      table.tagId,
    ),
  }),
);
export const experienceTagSelectSchema =
  createSelectSchema(experienceTagsTable);
export type ExperienceTag = typeof experienceTagsTable.$inferSelect;

export const experienceFavoritesTable = pgTable(
  "experience_favorites",
  {
    experienceId: integer("experience_id")
      .notNull()
      .references(() => experiencesTable.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
  },
  (table) => ({
    experience_favorites_pk: primaryKey({
      columns: [table.experienceId, table.userId],
    }),
    experience_favorites_experience_id_idx: index(
      "experience_favorites_experience_id_idx",
    ).on(table.experienceId),
    experience_favorites_user_id_idx: index(
      "experience_favorites_user_id_idx",
    ).on(table.userId),
  }),
);

export const experienceFavoriteSelectSchema = createSelectSchema(
  experienceFavoritesTable,
);
export type ExperienceFavorite = typeof experienceFavoritesTable.$inferSelect;
