import { faker } from "@faker-js/faker";

import { auth } from "../features/auth";
import {
  commentsTable,
  experiencesTable,
  userFollowsTable,
  usersTable,
} from "./schema";

import { db } from ".";

async function seed() {
  // Create demo user
  await db
    .insert(usersTable)
    .values({
      name: "Cosden Solutions",
      email: "demo@cosdensolutions.io",
      password: await auth.hashPassword("cosdensolutions"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .returning();

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

    await db.insert(experiencesTable).values({
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraph(),
      userId: postUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // Add some sample comments
  for (let experienceId = 1; experienceId <= 10; experienceId++) {
    for (let i = 0; i < 3; i++) {
      const users = await db.query.usersTable.findMany();
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
  const users = await db.query.usersTable.findMany();

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
