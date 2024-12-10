import { z } from "zod";

export const commentValidationSchema = z.object({
  content: z.string().min(1, "Content is required"),
});
