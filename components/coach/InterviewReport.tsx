'use client'

import { motion } from 'framer-motion'
import {
  Trophy, TrendingUp, AlertCircle, CheckCircle, Target,
  MessageSquare, Brain, Zap, ArrowRight, X, Download,
} from 'lucide-react'

interface ReportData {
  overall_score: number
  grade: string
  summary: string
  scores: {
    confidence: number
    communication: number
    technical_knowledge: number
    structure: number
    relevance: number
  }
  strengths: string[]
  weaknesses: string[]
  filler_words_count: number
  avg_answer_length: string
  star_method_used: boolean
  question_breakdown: { question: string; score: number; feedback: string }[]
  improvement_tips: string[]
  next_steps: string[]
}

interface InterviewReportProps {
  report: ReportData
  company: string
  role: string
  sessionType: string
  onClose: () => void
}

function ScoreBar({ label, score, icon: Icon }: { label: string; score: number; icon: any }) {
  const getColor = (s: number) => {
    if (s >= 80) return 'bg-green-500'
    if (s >= 60) return 'bg-blue-500'
    if (s >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          <span className="text-sm font-bold text-slate-900">{score}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`h-2 rounded-full ${getColor(score)}`}
          />
        </div>
      </div>
    </div>
  )
}

export default function InterviewReport({ report, company, role, sessionType, onClose }: InterviewReportProps) {
  const getGradeColor = (grade: string) => {
    if (grade === 'A') return 'text-green-600 bg-green-50 border-green-200'
    if (grade === 'B') return 'text-blue-600 bg-blue-50 border-blue-200'
    if (grade === 'C') return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[9999] bg-white overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-100 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Interview Report</h1>
            <p className="text-sm text-slate-500">{company} · {role} · {sessionType}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Overall Score */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center"
        >
          <div className="inline-flex flex-col items-center">
            <div className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center ${getGradeColor(report.grade)}`}>
              <span className="text-4xl font-black">{report.overall_score}</span>
              <span className="text-xs font-bold uppercase">/ 100</span>
            </div>
            <div className={`mt-3 px-4 py-1 rounded-full border text-sm font-bold ${getGradeColor(report.grade)}`}>
              Grade: {report.grade}
            </div>
          </div>
          <p className="mt-4 text-slate-600 max-w-md mx-auto">{report.summary}</p>
        </motion.div>

        {/* Score Breakdown */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-200 p-6"
        >
          <h2 className="text-lg font-bold text-slate-900 mb-5">Performance Breakdown</h2>
          <div className="space-y-4">
            <ScoreBar label="Confidence" score={report.scores.confidence} icon={Zap} />
            <ScoreBar label="Communication" score={report.scores.communication} icon={MessageSquare} />
            <ScoreBar label="Technical Knowledge" score={report.scores.technical_knowledge} icon={Brain} />
            <ScoreBar label="Structure (STAR)" score={report.scores.structure} icon={Target} />
            <ScoreBar label="Relevance" score={report.scores.relevance} icon={TrendingUp} />
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-3 gap-4"
        >
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{report.filler_words_count}</p>
            <p className="text-xs text-slate-500 mt-1">Filler Words</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-slate-900 capitalize">{report.avg_answer_length}</p>
            <p className="text-xs text-slate-500 mt-1">Answer Length</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{report.star_method_used ? '✓' : '✗'}</p>
            <p className="text-xs text-slate-500 mt-1">STAR Method</p>
          </div>
        </motion.div>

        {/* Strengths & Weaknesses */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="bg-green-50 rounded-2xl border border-green-100 p-6">
            <h3 className="font-bold text-green-800 flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5" />
              Strengths
            </h3>
            <ul className="space-y-2">
              {report.strengths.map((s, i) => (
                <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-orange-50 rounded-2xl border border-orange-100 p-6">
            <h3 className="font-bold text-orange-800 flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5" />
              Areas to Improve
            </h3>
            <ul className="space-y-2">
              {report.weaknesses.map((w, i) => (
                <li key={i} className="text-sm text-orange-700 flex items-start gap-2">
                  <span className="text-orange-500 mt-0.5">•</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Question Breakdown */}
        {report.question_breakdown?.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl border border-slate-200 p-6"
          >
            <h2 className="text-lg font-bold text-slate-900 mb-5">Question-by-Question</h2>
            <div className="space-y-4">
              {report.question_breakdown.map((q, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-sm font-medium text-slate-800">Q{i + 1}: {q.question}</p>
                    <span className={`flex-shrink-0 text-sm font-bold px-2 py-0.5 rounded-full ${
                      q.score >= 80 ? 'bg-green-100 text-green-700' :
                      q.score >= 60 ? 'bg-blue-100 text-blue-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {q.score}%
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{q.feedback}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Improvement Tips */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0A6A47]/5 rounded-2xl border border-[#0A6A47]/10 p-6"
        >
          <h2 className="text-lg font-bold text-[#0A6A47] flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5" />
            How to Improve
          </h2>
          <div className="space-y-3">
            {report.improvement_tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0A6A47] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </div>
                <p className="text-sm text-slate-700">{tip}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="bg-slate-900 rounded-2xl p-6 text-white"
        >
          <h2 className="text-lg font-bold mb-4">Next Steps</h2>
          <div className="space-y-3">
            {report.next_steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <ArrowRight className="w-4 h-4 text-[#0A6A47] flex-shrink-0" />
                <p className="text-sm text-slate-300">{step}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4 pb-8">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-[#0A6A47] text-white rounded-xl font-semibold hover:bg-[#085c3d] transition-colors"
          >
            Practice Again
          </button>
        </div>
      </div>
    </motion.div>
  )
}
