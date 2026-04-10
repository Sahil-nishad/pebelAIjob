import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { adminAuth } from './firebase-admin'
import { getSupabaseServer } from './supabase'

interface AuthUser {
  id: string
  firebaseUid: string
  email: string | undefined
}

function toDatabaseUserId(firebaseUid: string) {
  const hex = createHash('sha256').update(`jobflow:${firebaseUid}`).digest('hex').slice(0, 32)
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `${(parseInt(hex.slice(16, 18), 16) & 0x3f | 0x80).toString(16).padStart(2, '0')}${hex.slice(18, 20)}`,
    hex.slice(20, 32),
  ].join('-')
}

export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null

  try {
    const decoded = await adminAuth.verifyIdToken(token)
    return { id: toDatabaseUserId(decoded.uid), firebaseUid: decoded.uid, email: decoded.email }
  } catch {
    return null
  }
}

export async function requireAuth(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return null
  const supabase = getSupabaseServer()

  const { data: byFirebase, error: firebaseLookupError } = await supabase
    .from('users')
    .select('id, firebase_uid')
    .eq('firebase_uid', user.firebaseUid)
    .maybeSingle()

  if (firebaseLookupError) {
    console.error('[auth] Failed to look up user by firebase_uid:', firebaseLookupError.message)
    return null
  }

  if (byFirebase?.id) {
    if (byFirebase.firebase_uid !== user.firebaseUid || user.email) {
      await supabase
        .from('users')
        .update({
          firebase_uid: user.firebaseUid,
          email: user.email ?? null,
        })
        .eq('id', byFirebase.id)
    }

    return { user: { ...user, id: byFirebase.id }, supabase }
  }

  const { data: byId, error: idLookupError } = await supabase
    .from('users')
    .select('id, firebase_uid')
    .eq('id', user.id)
    .maybeSingle()

  if (idLookupError) {
    console.error('[auth] Failed to look up user by id:', idLookupError.message)
    return null
  }

  const targetId = byId?.id || user.id

  const { error } = await supabase.from('users').upsert(
    {
      id: targetId,
      firebase_uid: user.firebaseUid,
      email: user.email ?? null,
    },
    { onConflict: 'id' }
  )

  if (error) {
    console.error('[auth] Failed to ensure user row:', error.message)
  }

  return { user: { ...user, id: targetId }, supabase }
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
