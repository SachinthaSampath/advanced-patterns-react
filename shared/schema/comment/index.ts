import { z } from "zod";

export const commentSchema = z.object({
  id: z.number(),
  content: z.string().min(1, "Content is required"),
});
