import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 5, // 5 hours in seconds
  },
  pages: {
    signIn: '/auth/signin',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password || ''
        )

        if (!isPasswordValid) {
          return null
        }

        // Pass remember value to JWT callback via user object
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          // @ts-expect-error maybe undefined
          remember: credentials.remember === 'true',
        }
      }
    })
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        // Set maxAge in token based on remember
        // @ts-expect-error maybe undefined
        const maxAge = user.remember ? 60 * 60 * 24 * 30 : 60 * 60 * 5; // 30 days or 5 hours
        return {
          ...token,
          id: user.id,
          maxAge,
          iat: Math.floor(Date.now() / 1000),
        }
      }
      return token
    },
    session: ({ session, token }) => {
      // Set cookie expiration based on maxAge in token
      if (typeof token?.maxAge === 'number' && typeof token?.iat === 'number') {
        session.expires = new Date((token.iat + token.maxAge) * 1000).toISOString();
      }
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
        },
      }
    },
  },
}