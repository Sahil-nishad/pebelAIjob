// Client-only — only import dynamically from browser components
import { jsPDF } from 'jspdf'

export interface QAPair {
  question: string
  answer: string
  category?: string
}

const GREEN  = '#1e6b42'
const DARK   = '#1a2420'
const GRAY   = '#6b7472'
const LIGHT  = '#f0f4f2'

function addLogo(doc: jsPDF) {
  const x = 14
  const y = 10

  // Bottom stone: dark green ellipse
  doc.setFillColor('#155233')
  doc.ellipse(x + 10, y + 11, 10, 3.2, 'F')
  doc.setFillColor('#1e7045')
  doc.ellipse(x + 10, y + 10, 10, 3.5, 'F')

  // Middle stone: light gray ellipse
  doc.setFillColor('#a8b0ac')
  doc.ellipse(x + 10, y + 5.5, 7.5, 2.8, 'F')
  doc.setFillColor('#c8d0cc')
  doc.ellipse(x + 10, y + 4.8, 7.5, 2.8, 'F')

  // Top stone: dark gray ellipse
  doc.setFillColor('#4a5450')
  doc.ellipse(x + 10, y + 1.2, 4.8, 2, 'F')
  doc.setFillColor('#7a8580')
  doc.ellipse(x + 10, y + 0.5, 4.8, 2, 'F')

  // "PebelAi" text
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(DARK)
  doc.text('PebelAi', x + 23, y + 8)

  // Tagline
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(GRAY)
  doc.text('Apply. Track. Get Hired.', x + 23.5, y + 12.5)
}

function addHeaderBar(doc: jsPDF, title: string, subtitle: string) {
  const pageW = doc.internal.pageSize.getWidth()

  // Thin green line under logo area
  doc.setDrawColor(GREEN)
  doc.setLineWidth(0.4)
  doc.line(14, 22, pageW - 14, 22)

  // Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.setTextColor(DARK)
  doc.text(title, 14, 33)

  // Subtitle
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(GRAY)
  doc.text(subtitle, 14, 40)

  // Generated date
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  doc.setFontSize(8)
  doc.text(`Generated: ${date}`, pageW - 14, 40, { align: 'right' })
}

function addFooter(doc: jsPDF, pageNum: number, total: number) {
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  doc.setDrawColor('#e2e8e5')
  doc.setLineWidth(0.3)
  doc.line(14, pageH - 14, pageW - 14, pageH - 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor('#9aa8a4')
  doc.text('PebelAi — AI Job Tracker & Interview Coach  |  pebelai.com', 14, pageH - 9)
  doc.text(`Page ${pageNum} of ${total}`, pageW - 14, pageH - 9, { align: 'right' })
}

function wrapText(doc: jsPDF, text: string, x: number, maxWidth: number, fontSize: number): string[] {
  doc.setFontSize(fontSize)
  return doc.splitTextToSize(text, maxWidth)
}

export function downloadQAPdf(
  pairs: QAPair[],
  meta: { title: string; subtitle: string; filename: string }
) {
  const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const marginL = 14
  const marginR = 14
  const textW   = pageW - marginL - marginR
  let y = 48

  // ── Page 1 header ──────────────────────────────────────────────────────────
  addLogo(doc)
  addHeaderBar(doc, meta.title, meta.subtitle)

  let pageNum = 1
  const estimatedTotal = Math.ceil(pairs.length / 2) + 1

  pairs.forEach((pair, i) => {
    const qLines  = wrapText(doc, pair.question, marginL, textW, 10)
    const aLines  = wrapText(doc, pair.answer,   marginL, textW, 9.5)
    const blockH  = 8 + qLines.length * 5 + 4 + aLines.length * 5 + 10

    // Page break
    if (y + blockH > pageH - 20) {
      addFooter(doc, pageNum, estimatedTotal)
      doc.addPage()
      pageNum++

      // Compact logo on continuation pages
      addLogo(doc)
      doc.setDrawColor(GREEN)
      doc.setLineWidth(0.4)
      doc.line(marginL, 22, pageW - marginR, 22)
      y = 30
    }

    // Question number badge
    doc.setFillColor(GREEN)
    doc.roundedRect(marginL, y, 8, 5.5, 1.2, 1.2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor('#ffffff')
    doc.text(`Q${i + 1}`, marginL + 4, y + 3.8, { align: 'center' })

    // Question text
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(DARK)
    doc.text(qLines, marginL + 10, y + 4)
    y += Math.max(8, qLines.length * 5 + 1)

    // Answer label
    doc.setFillColor(LIGHT)
    doc.roundedRect(marginL, y, textW, aLines.length * 5 + 6, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(GREEN)
    doc.text('IDEAL ANSWER', marginL + 3, y + 4.5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor('#3d4442')
    doc.text(aLines, marginL + 3, y + 10)
    y += aLines.length * 5 + 10

    // Divider between Q&A blocks
    if (i < pairs.length - 1) {
      doc.setDrawColor('#e2e8e5')
      doc.setLineWidth(0.2)
      doc.line(marginL, y, pageW - marginR, y)
      y += 6
    }
  })

  addFooter(doc, pageNum, pageNum)
  doc.save(meta.filename)
}


// ── Session PDF ─────────────────────────────────────────────────────────────
export function downloadSessionPdf(
  messages: { role: 'user' | 'assistant'; content: string }[],
  meta: { company: string; role: string; sessionType: string }
) {
  // Pair up: assistant (question) → user (answer), skip intro message
  const pairs: QAPair[] = []
  const filtered = messages.filter(m => m.role !== 'system')

  for (let i = 0; i < filtered.length - 1; i++) {
    const curr = filtered[i]
    const next = filtered[i + 1]
    if (curr.role === 'assistant' && next.role === 'user') {
      // Strip markdown/bullet formatting from content
      const cleanText = (t: string) => t.replace(/\*\*(.*?)\*\*/g, '$1').replace(/^[-•*]\s+/gm, '').trim()
      pairs.push({
        question: cleanText(curr.content),
        answer:   cleanText(next.content),
        category: meta.sessionType,
      })
      i++ // skip the user message we just consumed
    }
  }

  if (pairs.length === 0) return false

  downloadQAPdf(pairs, {
    title:    `${meta.company} — ${meta.role || 'Interview'} Session`,
    subtitle: `${meta.sessionType.charAt(0).toUpperCase() + meta.sessionType.slice(1)} Interview · AI Coach Session Transcript`,
    filename: `pebelai-session-${meta.company.toLowerCase().replace(/\s+/g, '-')}.pdf`,
  })
  return true
}
