import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const statusConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
  applied: { label: 'Applied', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  phone_screen: { label: 'Phone Screen', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  interviewing: { label: 'Interviewing', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  offer: { label: 'Offer', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  rejected: { label: 'Rejected', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  ghosted: { label: 'Ghosted', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
}
