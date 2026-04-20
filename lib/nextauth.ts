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
        const { data: user } = await supabase
          .from('users')
          .select('id, email, name, password_hash')
          .eq('email', credentials.email.toLowerCase().trim())
          .maybeSingle()

        if (!user?.password_hash) return null

        const valid = await bcrypt.compare(credentials.password, user.password_hash)
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          const supabase = getSupabaseServer()
          const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('email', user.email!)
            .maybeSingle()

          if (existing) {
            user.id = existing.id
          } else {
            // upsert handles race conditions and duplicate emails gracefully
            const { data: upserted, error } = await supabase
              .from('users')
              .upsert(
                { email: user.email, name: user.name },
                { onConflict: 'email', ignoreDuplicates: false }
              )
              .select('id')
              .single()
            if (error) {
              console.error('[nextauth] Failed to upsert user in DB:', error.message)
            }
            if (upserted) user.id = upserted.id
          }
        } catch (err) {
          console.error('[nextauth] signIn callback error:', err)
          // Don't block sign-in for DB errors
        }
      }
      return true
    },

    async jwt({ token, user }) {
      if (user) token.dbId = user.id
      // Fallback: if dbId is missing (e.g. DB insert failed at sign-in), resolve from email
      if (!token.dbId && token.email) {
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
