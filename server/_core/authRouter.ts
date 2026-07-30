import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { publicProcedure, router } from "./trpc";
import { sdk } from "./sdk";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

const SALT_ROUNDS = 12;

export const authRouter = router({
  signup: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await db.getUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already registered",
        });
      }

      const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
      const openId = randomUUID();

      await db.upsertUser({
        openId,
        email: input.email,
        name: input.name || null,
        passwordHash,
        loginMethod: "password",
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByOpenId(openId);
      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user",
        });
      }

      const token = await sdk.createSessionToken(user.openId, {
        name: user.name ?? "",
      });
      ctx.res.cookie(COOKIE_NAME, token, getSessionCookieOptions(ctx.req));

      return { id: user.id, email: user.email, name: user.name };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await db.getUserByEmail(input.email);

      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });

      const token = await sdk.createSessionToken(user.openId, {
        name: user.name ?? "",
      });
      ctx.res.cookie(COOKIE_NAME, token, getSessionCookieOptions(ctx.req));

      return { id: user.id, email: user.email, name: user.name };
    }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
    return { success: true };
  }),

  // Public + nullable: the app is usable logged-out, so `me` must return null
  // (not throw UNAUTHORIZED) when there is no session. Returning the full user
  // object keeps the client's useAuth() state in sync.
  me: publicProcedure.query(({ ctx }) => ctx.user),
});
