import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'ghost'
  className?: string
}

const variants: Record<string, string> = {
  default: 'bg-slate-100 text-slate-600 ring-slate-200/50',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200/50',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200/50',
  danger: 'bg-red-50 text-red-600 ring-red-200/50',
  info: 'bg-blue-50 text-blue-700 ring-blue-200/50',
  ghost: 'bg-slate-50 text-slate-500 ring-slate-200/50',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide ring-1 ring-inset',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
