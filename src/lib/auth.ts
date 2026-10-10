import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { passkey } from "@better-auth/passkey";
import { prisma } from "./prisma";
import { sendMagicLinkEmail } from "./email";
import { site } from "./site";

// Passkeys are tied to one domain. Ones registered on localhost won't work on the live site.
const appUrl = new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000");

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
  },
  user: {
    additionalFields: {
      // input: false stops anyone setting their own role through the auth API
      role: { type: "string", required: false, defaultValue: "customer", input: false },
    },
  },
  hooks: {
    // Only the admin account can register passkeys. Clients use email links.
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path.startsWith("/passkey/") && /regist|add/i.test(ctx.path)) {
        const session = await getSessionFromCtx(ctx);
        const role = (session?.user as { role?: string } | undefined)?.role;
        if (role !== "admin") throw new APIError("FORBIDDEN", { message: "Passkeys are only available for the admin account" });
      }
    }),
  },
  plugins: [
    magicLink({
      // Only people you've created a job for (and the seeded admin) can sign in.
      disableSignUp: true,
      expiresIn: 60 * 15,
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail(email, url);
      },
    }),
    passkey({
      rpID: appUrl.hostname,
      rpName: site.name,
      origin: appUrl.origin,
      authenticatorSelection: {
        residentKey: "required", // lets you sign in without typing your email
        userVerification: "required", // always asks for Face ID, fingerprint or device PIN
      },
    }),
    nextCookies(), // must be last
  ],
});

export type SessionUser = typeof auth.$Infer.Session.user;
