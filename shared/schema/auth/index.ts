import { z } from "zod";

export const userCredentialsSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});
export type UserCredentials = z.infer<typeof userCredentialsSchema>;
