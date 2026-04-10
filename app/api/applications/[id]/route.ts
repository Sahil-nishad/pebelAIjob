import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  const { user, supabase } = auth
  const { id } = await params
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) return new NextResponse(JSON.stringify({ error: error.message }), { status: 404 })
  return new Response(JSON.stringify(data), { status: 200 })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  const { user, supabase } = auth
  const { id } = await params
  const body = await req.json()

  const { data, error } = await supabase
    .from('applications')
    .update(body)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return new NextResponse(JSON.stringify({ error: error.message }), { status: 400 })
  return new Response(JSON.stringify(data), { status: 200 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  const { user, supabase } = auth
  const { id } = await params
  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return new NextResponse(JSON.stringify({ error: error.message }), { status: 400 })
  return new Response(JSON.stringify({ success: true }), { status: 200 })
}
