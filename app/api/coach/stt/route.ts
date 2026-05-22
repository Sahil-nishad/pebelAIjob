import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY

// HEAD /api/coach/stt — quick check whether STT is available
export async function HEAD(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  if (!DEEPGRAM_API_KEY) return new NextResponse(null, { status: 503 })
  return new NextResponse(null, { status: 200 })
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  if (!DEEPGRAM_API_KEY) {
    return NextResponse.json({ error: 'STT not configured' }, { status: 503 })
  }

  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio provided' }, { status: 400 })
    }

    const audioBuffer = await audioFile.arrayBuffer()

    // Deepgram nova-2 — best accuracy for Indian English + technical terms
    const params = new URLSearchParams({
      model: 'nova-2',
      language: 'en-IN',        // Indian English — much better for Indian accents
      smart_format: 'true',     // Auto-punctuation, numbers, etc.
      punctuate: 'true',
      diarize: 'false',
      filler_words: 'false',    // Remove "um", "uh" from transcript
      profanity_filter: 'false',
      numerals: 'true',         // Convert "five" → "5"
      utterances: 'false',
    })

    const response = await fetch(
      `https://api.deepgram.com/v1/listen?${params.toString()}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type': audioFile.type || 'audio/webm',
        },
        body: audioBuffer,
      }
    )

    if (!response.ok) {
      const err = await response.text()
      console.error('[STT] Deepgram error:', response.status, err)
      return NextResponse.json({ error: 'STT failed', transcript: '' }, { status: 502 })
    }

    const data = await response.json()
    const transcript = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || ''
    const confidence = data?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0

    return NextResponse.json({ transcript, confidence })
  } catch (err) {
    console.error('[STT] Error:', err)
    return NextResponse.json({ error: 'STT request failed', transcript: '' }, { status: 500 })
  }
}
