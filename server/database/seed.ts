import { faker } from "@faker-js/faker";

import { auth } from "../features/auth";
import {
  commentsTable,
  experienceAttendeesTable,
  experiencesTable,
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

    await db.insert(experiencesTable).values({
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraph(),
      scheduledAt: faker.date.soon().toISOString(),
      url: faker.internet.url(),
      imageUrl: faker.image.urlPicsumPhotos(),
      userId: experienceUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // Add random attendees to experiences
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
        await db.insert(experienceAttendeesTable).values({
          experienceId: experience.id,
          userId: attendee.id,
          createdAt: faker.date
            .between({
              from: experience.createdAt,
              to: new Date(),
            })
            .toISOString(),
        });
      } catch {
        // Ignore duplicate attendees
        continue;
      }
    }
  }

  // Add some sample comments
  for (let experienceId = 1; experienceId <= 10; experienceId++) {
    for (let i = 0; i < 3; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];

      await db.insert(commentsTable).values({
        experienceId,
        content:
          Math.random() > 0.5
            ? faker.lorem.paragraph()
            : faker.lorem.sentence(),
        userId: randomUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
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
      } catch {
        // Ignore duplicate follows
        continue;
      }
    }
  }
}

seed();
