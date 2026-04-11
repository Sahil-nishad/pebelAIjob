import { NextRequest } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth) return unauthorized()

  const { user, supabase } = auth
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', user.id)
    .order('applied_date', { ascending: false })

  if (error) return unauthorized()
  return new Response(JSON.stringify(data), { status: 200 })
}
