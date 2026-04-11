import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (!auth) return unauthorized()

  const { user, supabase } = auth
  const { id } = await params
  const { status } = await req.json()

  const { data, error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return new NextResponse(JSON.stringify({ error: error.message }), { status: 400 })

  await supabase.from('activity_log').insert({
    user_id: user.id,
    application_id: id,
    event_type: 'stage_change',
    event_data: { new_status: status },
  })

  return new Response(JSON.stringify(data), { status: 200 })
}
