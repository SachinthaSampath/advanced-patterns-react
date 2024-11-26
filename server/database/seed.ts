import { postsTable } from "../features/post/models";

import { db } from ".";

async function seed() {
  await db.insert(postsTable).values({
    title: "Hello, world!",
    content: "This is a test post.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

seed();
