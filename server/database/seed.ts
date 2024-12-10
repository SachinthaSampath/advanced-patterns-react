import { faker } from "@faker-js/faker";

import { auth } from "../features/auth";
import { commentsTable, experiencesTable, usersTable } from "./schema";

import { db } from ".";

async function seed() {
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
}

seed();
