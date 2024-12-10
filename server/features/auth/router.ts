import { userCredentialsSchema } from "@advanced-react/shared/schema/auth";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "../../database";
import { protectedProcedure, publicProcedure, router } from "../../trpc";
import { auth } from "./index";
import { cleanUserSelectSchema, usersTable } from "./models";

export const authRouter = router({
  register: publicProcedure
    .input(userCredentialsSchema)
    .output(
      z.object({
        accessToken: z.string(),
        user: cleanUserSelectSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.email, input.email),
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "This email is already registered. Please try logging in instead.",
        });
      }

      const hashedPassword = await auth.hashPassword(input.password);
      const now = new Date().toISOString();

      const users = await db
        .insert(usersTable)
        .values({
          name: input.name,
          email: input.email,
          password: hashedPassword,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const refreshToken = auth.createToken(
        { userId: users[0].id },
        { expiresIn: "7d" },
      );

      // Set refresh token as a cookie
      ctx.res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Creates access token
      const accessToken = auth.createToken(
        { refreshToken },
        { expiresIn: "15m" },
      );

      return { accessToken, user: users[0] };
    }),

  login: publicProcedure
    .input(userCredentialsSchema)
    .output(
      z.object({
        accessToken: z.string(),
        user: cleanUserSelectSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.email, input.email),
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password. Please try again.",
        });
      }

      const isValid = await auth.verifyPassword(input.password, user.password);

      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password. Please try again.",
        });
      }

      const refreshToken = auth.createToken(
        { userId: user.id },
        { expiresIn: "7d" },
      );

      // Set refresh token as a cookie
      ctx.res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      const accessToken = auth.createToken(
        { refreshToken },
        { expiresIn: "15m" },
      );

      return { accessToken, user };
    }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    // Clear refresh token cookie
    ctx.res.clearCookie("refreshToken");
    return;
  }),

  currentUser: publicProcedure
    .output(
      z.object({
        accessToken: z.string().nullable(),
        currentUser: cleanUserSelectSchema.nullable(),
      }),
    )
    .query(async ({ ctx }) => {
      if (!ctx.user) {
        return { accessToken: null, currentUser: null };
      }

      // Return user without password
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...cleanUser } = ctx.user;

      return { accessToken: ctx.accessToken, currentUser: cleanUser };
    }),
});
