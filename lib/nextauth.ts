import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { getSupabaseServer } from './supabase'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const supabase = getSupabaseServer()
        const { data: user, error } = await supabase
          .from('users')
          .select('id, email, name, password_hash, email_verified')
          .eq('email', credentials.email.toLowerCase().trim())
          .maybeSingle()

        if (error) {
          console.error('[nextauth] Credentials lookup failed:', error.message)
          return null
        }

        if (!user?.password_hash) return null

        const valid = await bcrypt.compare(credentials.password, user.password_hash)
        if (!valid) return null

        if (!user.email_verified) throw new Error('EmailNotVerified')

        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        if (!user.email) return false

        const googleProfile = profile as { email_verified?: boolean } | undefined
        if (googleProfile?.email_verified === false) return false

        try {
          const supabase = getSupabaseServer()
          // Use limit(1) instead of maybeSingle() — avoids errors when duplicate rows exist
          const { data: rows } = await supabase
            .from('users')
            .select('id')
            .eq('email', user.email)
            .limit(1)

          const existing = rows?.[0] ?? null

          if (existing) {
            user.id = existing.id
          } else {
            // Insert new user row (no upsert — email column has no unique constraint)
            const { data: inserted, error: insertError } = await supabase
              .from('users')
              .insert({ email: user.email, name: user.name, email_verified: true })
              .select('id')
              .single()

            if (insertError) {
              // Race condition: another request may have just inserted the row
              const { data: retry } = await supabase
                .from('users')
                .select('id')
                .eq('email', user.email)
                .limit(1)
              const retryUser = retry?.[0] ?? null
              if (!retryUser) {
                console.error('[nextauth] Failed to create user:', insertError.message)
                return false
              }
              user.id = retryUser.id
            } else {
              user.id = inserted.id
            }
          }
        } catch (err) {
          console.error('[nextauth] signIn callback error:', err)
          return false
        }
      }
      return true
    },

    async jwt({ token, user }) {
      if (user) token.dbId = user.id
      // Resolve dbId if missing or not a valid UUID (e.g. Google numeric ID stored from an old session)
      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const dbIdIsUuid = UUID_RE.test(token.dbId as string)
      if ((!token.dbId || !dbIdIsUuid) && token.email) {
        try {
          const supabase = getSupabaseServer()
          const { data } = await supabase
            .from('users')
            .select('id')
            .eq('email', token.email)
            .maybeSingle()
          if (data?.id) token.dbId = data.id
        } catch (_) {}
      }
      return token
    },

    async session({ session, token }) {
      if (token.dbId) session.user.id = token.dbId
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  secret: process.env.NEXTAUTH_SECRET,
}
