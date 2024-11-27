import { commentsTable } from "../features/comment/models";
import { experiencesTable } from "../features/experience/models";

import { db } from ".";

async function seed() {
  for (let i = 0; i < 100; i++) {
    await db.insert(experiencesTable).values({
      title: `Hello, world! ${i}`,
      content: "This is a test post.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // Add some sample comments
  for (let experienceId = 1; experienceId <= 10; experienceId++) {
    for (let i = 0; i < 3; i++) {
      await db.insert(commentsTable).values({
        experienceId,
        content: `Sample comment ${i + 1} for post ${experienceId}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

seed();
