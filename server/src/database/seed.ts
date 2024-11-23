import { db } from ".";

import { postsTable } from "@/features/post/models";

async function seed() {
  await db.insert(postsTable).values({
    title: "Hello, world!",
    content: "This is a test post.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

seed();
