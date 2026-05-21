import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY

// Available voices — user can choose
const VOICES: Record<string, string> = {
  // Female
  'athena': 'aura-athena-en',
  'asteria': 'aura-asteria-en',
  'luna': 'aura-luna-en',
  'stella': 'aura-stella-en',
  'hera': 'aura-hera-en',
  // Male
  'orion': 'aura-orion-en',
  'orpheus': 'aura-orpheus-en',
  'perseus': 'aura-perseus-en',
  'zeus': 'aura-zeus-en',
  'arcas': 'aura-arcas-en',
}

const DEFAULT_VOICE = 'aura-athena-en'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  if (!DEEPGRAM_API_KEY) {
    return NextResponse.json({ error: 'TTS not configured' }, { status: 503 })
  }

  let body: { text?: string; voice?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const text = String(body.text || '').trim().slice(0, 1000)
  if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 })

  // Resolve voice — accept short name or full model name
  const voiceKey = (body.voice || '').toLowerCase()
  const model = VOICES[voiceKey] || (voiceKey.startsWith('aura-') ? voiceKey : DEFAULT_VOICE)

  try {
    const response = await fetch(`https://api.deepgram.com/v1/speak?model=${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[TTS] Deepgram error:', response.status, err)
      return NextResponse.json({ error: 'TTS generation failed' }, { status: 502 })
    }

    const audioBuffer = await response.arrayBuffer()
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error('[TTS] Error:', err)
    return NextResponse.json({ error: 'TTS request failed' }, { status: 500 })
  }
}
