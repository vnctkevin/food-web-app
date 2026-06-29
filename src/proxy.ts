import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

// Use only the Edge-safe config (no Prisma, no pg).
// The `authorized` callback in authConfig handles redirecting unauthenticated
// users to the signIn page (pages.signIn = '/').
const { auth } = NextAuth(authConfig)

export default auth

export const config = {
  matcher: ['/chat/:path*'],
}
