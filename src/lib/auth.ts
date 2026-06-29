import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'
import { authConfig } from '../auth.config'

// Full auth config with Prisma adapter (Node.js runtime only — never imported in middleware).
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  callbacks: {
    session({ session, token }) {
      // token.sub is the user ID set by NextAuth
      if (token.sub) session.user.id = token.sub
      return session
    },
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id
      return token
    },
  },
})
