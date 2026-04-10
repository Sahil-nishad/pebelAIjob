'use client'

import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { authFetch } from '@/lib/api'

interface AnalysisResult {
  score: number
  summary: string
  keywords_found: string[]
  keywords_missing: string[]
  skills_strong: string[]
  skills_partial: { skill: string; reason: string }[]
  skills_missing: string[]
  suggestions: string[]
  ats_issues: string[]
  bullet_rewrites: { original: string; improved: string }[]
}

const mockAnalysis: AnalysisResult = {
  score: 73,
  summary: 'Good match with some gaps in cloud infrastructure and Go experience.',
  keywords_found: ['Python', 'React', 'TypeScript', 'Agile', 'SQL', 'REST APIs', 'Docker', 'CI/CD', 'Product Management', 'A/B Testing', 'User Research', 'Data Analysis', 'Leadership', 'Cross-functional'],
  keywords_missing: ['Kubernetes', 'Terraform', 'Go', 'gRPC', 'Distributed Systems', 'System Design'],
  skills_strong: ['Communication', 'Leadership', 'React/TypeScript', 'Product Strategy'],
  skills_partial: [
    { skill: 'System Design', reason: 'Mentioned but not detailed with examples' },
    { skill: 'Cloud Infrastructure', reason: 'Docker mentioned, but no K8s or cloud provider experience' },
  ],
  skills_missing: ['Kubernetes', 'Go', 'Terraform'],
  suggestions: [
    'Add "Kubernetes" to skills section — mentioned 4x in JD',
    'Quantify impact in your role at Acme Corp (revenue, users, etc.)',
    'Add a project section showing React + TypeScript work',
    'ATS score low — add more exact phrases from the job description',
    'Move relevant skills higher in the resume',
    'Add "Distributed Systems" experience from your backend work',
  ],
  ats_issues: [
    'Single column layout detected — good for ATS',
    'Standard section headers found',
    'Some tables detected — may confuse certain ATS systems',
    'Missing: Keywords in first 100 words of resume',
  ],
  bullet_rewrites: [
    { original: 'Worked on payment system', improved: 'Engineered payment processing system handling $2M/month, reducing transaction latency by 40% using Redis caching' },
    { original: 'Led team of engineers', improved: 'Led cross-functional team of 8 engineers and 3 designers, delivering the v2.0 platform 2 weeks ahead of schedule' },
    { original: 'Improved user experience', improved: 'Redesigned onboarding flow resulting in 35% increase in user activation rate and 20% reduction in support tickets' },
  ],
}

const mockHistory = [
  { company: 'Google', role: 'Senior PM', score: 73, date: '2024-01-12' },
  { company: 'Stripe', role: 'Engineer', score: 85, date: '2024-01-10' },
  { company: 'Meta', role: 'PM Lead', score: 68, date: '2024-01-08' },
]

export default function ResumePage() {
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [selectedFileName, setSelectedFileName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const readFileAsText = async (file: File) => {
    const text = await file.text()
    // Best-effort cleanup for pasted/extracted text.
    return text.replace(/\u0000/g, '').trim()
  }

  const handleFile = async (file: File | null) => {
    if (!file) return

    const allowed = /\.(pdf|docx?|txt|md|rtf|html?)$/i.test(file.name)
    if (!allowed) {
      toast.error('Please upload a PDF, DOCX, or text file')
      return
    }

    setSelectedFileName(file.name)
    try {
      const text = await readFileAsText(file)
      if (!text) {
        toast.error('Could not read text from that file. Try pasting the resume text instead.')
        return
      }

      setResumeText(text)
      toast.success(`Loaded ${file.name}`)
    } catch {
      toast.error('Failed to read that file')
    }
  }

  const handleAnalyze = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      toast.error('Please paste both your resume and the job description')
      return
    }
    setAnalyzing(true)
    try {
      const res = await authFetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAnalysis(data.analysis)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed'
      toast.error(msg)
      // Fallback to mock so the UI is still usable
      setAnalysis(mockAnalysis)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleReset = () => {
    setAnalysis(null)
    setResumeText('')
    setJobDescription('')
    setSelectedFileName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500'
    if (score >= 60) return 'text-amber-500'
    return 'text-red-500'
  }

  const scoreRingColor = (score: number) => {
    if (score >= 80) return 'stroke-emerald-500'
    if (score >= 60) return 'stroke-amber-500'
    return 'stroke-red-500'
  }

  if (!analysis) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-slate-900 mb-2">
            Analyze Your Resume
          </h2>
          <p className="text-sm text-slate-500">Compare your resume against any job description for instant AI feedback</p>
        </div>

        <Card>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Step 1: Your Resume</h3>
          <label
            htmlFor="resume-upload"
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              handleFile(e.dataTransfer.files?.[0] || null)
            }}
            className={`relative block border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer mb-3 outline-none ${
              isDragging
                ? 'border-emerald-400 bg-emerald-50/40'
                : 'border-slate-200 hover:border-emerald-400'
            }`}
          >
            <input
              id="resume-upload"
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.md,.rtf,.html,.htm"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                void handleFile(file)
                e.currentTarget.value = ''
              }}
            />
            <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Drag and drop a PDF, DOCX, or text file</p>
            <p className="text-xs text-slate-400">or click to browse</p>
          </label>
          {selectedFileName && (
            <p className="text-xs text-emerald-600 mb-3">
              Loaded file: {selectedFileName}
            </p>
          )}
          <div className="text-center text-xs text-slate-400 mb-3">- or paste text directly -</div>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            rows={6}
            placeholder="Paste your resume text here..."
            className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
          />
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Step 2: Job Description</h3>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={6}
            placeholder="Paste the job description here..."
            className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
          />
        </Card>

        <Button size="lg" className="w-full" onClick={handleAnalyze} loading={analyzing}>
          {analyzing ? 'AI is analyzing... this takes ~15 seconds' : 'Analyze Now'}
          {!analyzing && <Sparkles className="w-4 h-4" />}
        </Button>

        {mockHistory.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Previous Analyses</h3>
            <div className="space-y-2">
              {mockHistory.map((h) => (
                <div key={h.company + h.role} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{h.company} - {h.role}</p>
                    <p className="text-xs text-slate-400">{h.date}</p>
                  </div>
                  <div className={`text-lg font-bold ${scoreColor(h.score)}`}>{h.score}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-slate-900">Analysis Results</h2>
        <Button variant="ghost" onClick={handleReset}><RotateCcw className="w-4 h-4" /> New Analysis</Button>
      </div>

      {/* Score Card */}
      <Card className="flex items-center gap-6">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="40" fill="none"
              className={scoreRingColor(analysis.score)}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${analysis.score * 2.51} 251`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ${scoreColor(analysis.score)}`}>{analysis.score}</span>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Overall Match Score</h3>
          <p className="text-sm text-slate-600">{analysis.summary}</p>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Keywords */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Keywords Match</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-500 mb-2">Found in resume ({analysis.keywords_found.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.keywords_found.map((k) => (
                  <span key={k} className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium">{k}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2">Missing from resume ({analysis.keywords_missing.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.keywords_missing.map((k) => (
                  <span key={k} className="px-2 py-0.5 rounded-full bg-red-50 text-red-500 text-xs font-medium">{k}</span>
                ))}
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <p className="text-sm text-slate-600">
                Match rate: <strong>{analysis.keywords_found.length}/{analysis.keywords_found.length + analysis.keywords_missing.length}</strong> keywords ({Math.round(analysis.keywords_found.length / (analysis.keywords_found.length + analysis.keywords_missing.length) * 100)}%)
              </p>
            </div>
          </div>
        </Card>

        {/* Skills */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Skills Gap Analysis</h3>
          <div className="space-y-3">
            {analysis.skills_strong.map((s) => (
              <div key={s} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-slate-700"><strong>Strong:</strong> {s}</span>
              </div>
            ))}
            {analysis.skills_partial.map((s) => (
              <div key={s.skill} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700"><strong>Partial:</strong> {s.skill} — {s.reason}</span>
              </div>
            ))}
            {analysis.skills_missing.map((s) => (
              <div key={s} className="flex items-center gap-2 text-sm">
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-slate-700"><strong>Missing:</strong> {s}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Suggestions */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Improvement Suggestions</h3>
          <ol className="space-y-2">
            {analysis.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-xs font-semibold text-emerald-600 flex-shrink-0 mt-0.5">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </Card>

        {/* ATS */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-900 mb-4">ATS Compatibility</h3>
          <div className="space-y-2">
            {analysis.ats_issues.map((issue) => {
              const isGood = issue.startsWith('Single') || issue.startsWith('Standard')
              const isWarning = issue.startsWith('Some')
              return (
                <div key={issue} className="flex items-start gap-2 text-sm">
                  {isGood && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />}
                  {isWarning && <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />}
                  {!isGood && !isWarning && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
                  <span className="text-slate-700">{issue}</span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Bullet Rewrites */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-900 mb-4">AI Rewrite Suggestions</h3>
        <div className="space-y-4">
          {analysis.bullet_rewrites.map((rewrite, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="p-4 bg-slate-50 rounded-xl space-y-2">
              <div>
                <span className="text-xs font-medium text-red-500">Before:</span>
                <p className="text-sm text-slate-500 line-through">{rewrite.original}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-emerald-500">After:</span>
                <p className="text-sm text-slate-900 font-medium">{rewrite.improved}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(rewrite.improved)}>
                <Copy className="w-3 h-3" /> Copy improved bullet
              </Button>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  )
}
