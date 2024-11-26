import { z } from "zod";

import "dotenv/config";

const envSchema = z.object({
  CLIENT_BASE_URL: z.string(),
});

export const env = envSchema.parse(process.env);
