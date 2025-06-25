import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

interface ExtendedUser {
  id: string;
  email: string;
  name: string | null;
  remember?: boolean;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 5, // 5 hours
  },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        remember: { label: "Remember Me", type: "checkbox" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          remember: credentials.remember === "true",
        } as ExtendedUser;
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user && typeof user === "object") {
        const remember = (user as ExtendedUser).remember;
        const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 5; // 30d or 5h
        const iat = Math.floor(Date.now() / 1000);
        return {
          ...token,
          id: user.id,
          maxAge,
          iat,
        };
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token && typeof token.maxAge === "number" && typeof token.iat === "number") {
        session.expires = new Date((token.iat + token.maxAge) * 1000).toISOString();
      }
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
        },
      };
    },
  },

  events: {
    async createUser({ user }) {
      try {
        await prisma.familyTree.create({
          data: {
            title: `${user.name ?? "Unnamed"}'s Tree`,
            createdById: user.id,
          },
        });
      } catch (error) {
        console.error("Failed to create family tree on signup:", error);
      }
    },
  },
};
