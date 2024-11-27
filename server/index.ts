import { createHTTPServer } from "@trpc/server/adapters/standalone";
import cors from "cors";

import { commentRouter } from "./features/comment/router";
import { experienceRouter } from "./features/experience/router";
import { router } from "./trpc";
import { env } from "./utils/env";

const appRouter = router({
  comments: commentRouter,
  experiences: experienceRouter,
});
export type AppRouter = typeof appRouter;

const server = createHTTPServer({
  router: appRouter,
  middleware: cors({
    origin: [env.CLIENT_BASE_URL],
    credentials: true,
  }),
});

server.listen(3000);
