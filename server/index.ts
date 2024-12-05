import * as trpcExpress from "@trpc/server/adapters/express";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import { authRouter } from "./features/auth/router";
import { commentRouter } from "./features/comment/router";
import { experienceRouter } from "./features/experience/router";
import { createContext, router } from "./trpc";
import { env } from "./utils/env";

const appRouter = router({
  auth: authRouter,
  comments: commentRouter,
  experiences: experienceRouter,
});
export type AppRouter = typeof appRouter;

const app = express();

app.use(cookieParser());

app.use((req, res, next) => {
  setTimeout(next, Math.floor(Math.random() * 1000 + 100));
});

app.use(
  "/",
  trpcExpress.createExpressMiddleware({
    middleware: cors({
      origin: env.CLIENT_BASE_URL,
      credentials: true,
    }),
    router: appRouter,
    createContext,
  }),
);

app.listen(3000);
