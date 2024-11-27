import { commentsTable } from "../features/comment/models";
import { postsTable } from "../features/post/models";

import { db } from ".";

async function seed() {
  for (let i = 0; i < 100; i++) {
    await db.insert(postsTable).values({
      title: `Hello, world! ${i}`,
      content: "This is a test post.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // Add some sample comments
  for (let postId = 1; postId <= 10; postId++) {
    for (let i = 0; i < 3; i++) {
      await db.insert(commentsTable).values({
        postId,
        content: `Sample comment ${i + 1} for post ${postId}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

seed();
