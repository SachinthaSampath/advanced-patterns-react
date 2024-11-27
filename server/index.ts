import { createHTTPServer } from "@trpc/server/adapters/standalone";
import cors from "cors";

import { commentRouter } from "./features/comment/router";
import { postRouter } from "./features/post/router";
import { router } from "./trpc";
import { env } from "./utils/env";

const appRouter = router({
  posts: postRouter,
  comments: commentRouter,
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
