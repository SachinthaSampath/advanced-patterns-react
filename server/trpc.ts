import { initTRPC } from "@trpc/server";

const t = initTRPC.create();

// Add middleware to simulate network delay
const withDelay = t.middleware(async ({ next }) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return next();
});

export const router = t.router;

// Apply the delay middleware to all procedures
export const publicProcedure = t.procedure.use(withDelay);
