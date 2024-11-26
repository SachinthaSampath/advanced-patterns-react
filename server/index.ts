import { createHTTPServer } from "@trpc/server/adapters/standalone";
import cors from "cors";

import { postRouter } from "./features/post/router";
import { router } from "./trpc";

const appRouter = router({
  posts: postRouter,
});
export type AppRouter = typeof appRouter;

const server = createHTTPServer({
  router: appRouter,
  middleware: cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  }),
});

server.listen(3000);
