import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glass?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingStyles = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export function Card({ children, className, hover, glass, padding = 'md' }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/60 bg-white',
        'shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
        paddingStyles[padding],
        hover && 'transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:border-slate-200',
        glass && 'glass',
        className
      )}
    >
      {children}
    </div>
  )
}
