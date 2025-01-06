import { faker } from "@faker-js/faker";

import { auth } from "../features/auth";
import {
  commentsTable,
  experienceAttendeesTable,
  experiencesTable,
  experienceTagsTable,
  notificationsTable,
  tagsTable,
  userFollowsTable,
  usersTable,
} from "./schema";

import { db } from ".";

async function seed() {
  // Create demo user
  const [demoUser] = await db
    .insert(usersTable)
    .values({
      name: "Cosden Solutions",
      email: "demo@cosdensolutions.io",
      password: await auth.hashPassword("cosdensolutions"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .returning();

  // Create some tags
  const tagNames = [
    "Hiking",
    "Running",
    "Biking",
    "Swimming",
    "Yoga",
    "Dinner",
    "Movie",
    "Concert",
    "Party",
    "Game Night",
    "Book Club",
    "Art Class",
    "Cooking Class",
    "Wine Tasting",
  ];

  const tags = tagNames.map((name) => ({
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const insertedTags = await db.insert(tagsTable).values(tags).returning();

  // Create other users and experiences
  for (let i = 0; i < 100; i++) {
    // Creates fake user
    const users = await db
      .insert(usersTable)
      .values({
        name: faker.person.firstName(),
        avatarUrl: faker.image.avatar(),
        email: faker.internet.email(),
        password: await auth.hashPassword(faker.internet.password()),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    const postUser = users[0];

    // 5% chance this experience will be attributed to the demo user
    const experienceUserId = Math.random() < 0.05 ? demoUser.id : postUser.id;

    const [experience] = await db
      .insert(experiencesTable)
      .values({
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraph(),
        scheduledAt: faker.date.soon().toISOString(),
        url: faker.internet.url(),
        imageUrl: faker.image.urlPicsumPhotos(),
        userId: experienceUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    // Add 1-4 random tags to each experience
    const numberOfTags = Math.floor(Math.random() * 4) + 1;
    const shuffledTags = [...insertedTags].sort(() => Math.random() - 0.5);

    for (let j = 0; j < numberOfTags && j < shuffledTags.length; j++) {
      const tag = shuffledTags[j];

      try {
        await db.insert(experienceTagsTable).values({
          experienceId: experience.id,
          tagId: tag.id,
          createdAt: new Date().toISOString(),
        });
      } catch {
        // Ignore duplicate tags
        continue;
      }
    }
  }

  // Add random attendees to experiences and create notifications
  const users = await db.query.usersTable.findMany();
  const experiences = await db.query.experiencesTable.findMany();

  for (const experience of experiences) {
    // Each experience will have between 0 and 20 random attendees
    const numberOfAttendees = Math.floor(Math.random() * 21);
    const shuffledUsers = [...users].sort(() => Math.random() - 0.5);

    for (let i = 0; i < numberOfAttendees && i < shuffledUsers.length; i++) {
      const attendee = shuffledUsers[i];

      // Don't attend your own experience
      if (attendee.id === experience.userId) {
        continue;
      }

      try {
        const [attendeeRecord] = await db
          .insert(experienceAttendeesTable)
          .values({
            experienceId: experience.id,
            userId: attendee.id,
            createdAt: faker.date
              .between({
                from: experience.createdAt,
                to: new Date(),
              })
              .toISOString(),
          })
          .returning();

        // Create notification for the experience owner
        await db.insert(notificationsTable).values({
          type: "user_attending_experience",
          experienceId: experience.id,
          fromUserId: attendee.id,
          userId: experience.userId,
          createdAt: attendeeRecord.createdAt,
        });
      } catch {
        // Ignore duplicate attendees
        continue;
      }
    }
  }

  // Add some sample comments and create notifications
  for (let experienceId = 1; experienceId <= 10; experienceId++) {
    for (let i = 0; i < 3; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];

      const [comment] = await db
        .insert(commentsTable)
        .values({
          experienceId,
          content:
            Math.random() > 0.5
              ? faker.lorem.paragraph()
              : faker.lorem.sentence(),
          userId: randomUser.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();

      // Get the experience owner
      const experience = experiences.find((e) => e.id === experienceId);
      if (experience) {
        // Create notification for the experience owner
        await db.insert(notificationsTable).values({
          type: "user_commented_experience",
          experienceId,
          commentId: comment.id,
          fromUserId: randomUser.id,
          userId: experience.userId,
          createdAt: comment.createdAt,
        });
      }
    }
  }

  // Add random follows between users
  // Each user will follow between 5-15 random users
  for (const user of users) {
    const numberOfFollows = Math.floor(Math.random() * 11) + 5; // Random number between 5-15
    const shuffledUsers = [...users].sort(() => Math.random() - 0.5);

    for (let i = 0; i < numberOfFollows && i < shuffledUsers.length; i++) {
      const userToFollow = shuffledUsers[i];

      // Don't follow yourself
      if (userToFollow.id === user.id) {
        continue;
      }

      try {
        await db.insert(userFollowsTable).values({
          followerId: user.id,
          followingId: userToFollow.id,
          createdAt: faker.date
            .between({
              from: user.createdAt,
              to: new Date(),
            })
            .toISOString(),
        });

        // Create notification for the user being followed
        await db.insert(notificationsTable).values({
          type: "user_followed_user",
          fromUserId: user.id,
          userId: userToFollow.id,
          createdAt: new Date().toISOString(),
        });
      } catch {
        // Ignore duplicate follows
        continue;
      }
    }
  }
}

seed();
