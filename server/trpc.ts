import { initTRPC } from "@trpc/server";
import { ZodError } from "zod";

const t = initTRPC.create({
  errorFormatter(opts) {
    const { shape, error } = opts;
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          // Only show zod errors for bad request errors
          error.code === "BAD_REQUEST" && error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
    };
  },
});

// Add middleware to simulate network delay
const withDelay = t.middleware(async ({ next }) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return next();
});

export const router = t.router;

// Apply the delay middleware to all procedures
export const publicProcedure = t.procedure.use(withDelay);
