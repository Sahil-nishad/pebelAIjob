import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import { deleteApplicationRecords } from '@/lib/application-store'
import { isMissingTableError } from '@/lib/supabase'

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  const { user, supabase } = auth

  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('user_id', user.id)

  if (error) {
    if (isMissingTableError(error, 'applications')) {
      deleteApplicationRecords(user.id)
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
