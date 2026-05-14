import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'

const CAREERS_API_URL = process.env.CAREERS_API_URL || 'http://localhost:8000'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  const { id } = await context.params

  try {
    const response = await fetch(`${CAREERS_API_URL}/api/v1/resumes/${id}`, {
      headers: { 'Authorization': req.headers.get('authorization') || '' },
    })
    const data = await response.json()
    if (!response.ok) return NextResponse.json({ error: data.detail || 'Failed to fetch resume' }, { status: response.status })
    return NextResponse.json(data)
  } catch (error) {
    console.error('Fetch resume error:', error)
    return NextResponse.json({ error: 'Failed to fetch resume' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  const { id } = await context.params

  try {
    const body = await req.json()
    const response = await fetch(`${CAREERS_API_URL}/api/v1/resumes/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': req.headers.get('authorization') || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    if (!response.ok) return NextResponse.json({ error: data.detail || 'Failed to update resume' }, { status: response.status })
    return NextResponse.json(data)
  } catch (error) {
    console.error('Update resume error:', error)
    return NextResponse.json({ error: 'Failed to update resume' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  const { id } = await context.params

  try {
    const response = await fetch(`${CAREERS_API_URL}/api/v1/resumes/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': req.headers.get('authorization') || '' },
    })
    const data = await response.json()
    if (!response.ok) return NextResponse.json({ error: data.detail || 'Failed to delete resume' }, { status: response.status })
    return NextResponse.json(data)
  } catch (error) {
    console.error('Delete resume error:', error)
    return NextResponse.json({ error: 'Failed to delete resume' }, { status: 500 })
  }
}
