import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { prisma } from "./prisma";
import { sendMagicLinkEmail } from "./email";

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
  plugins: [
    magicLink({
      // Only people you've created a job for (and the seeded admin) can sign in.
      disableSignUp: true,
      expiresIn: 60 * 15,
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail(email, url);
      },
    }),
    nextCookies(), // must be last
  ],
});

export type SessionUser = typeof auth.$Infer.Session.user;
