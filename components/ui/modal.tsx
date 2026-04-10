'use client'

import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'drawer'
  centered?: boolean
}

const sizeStyles = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-4xl',
  drawer: 'max-w-[480px] ml-auto h-full rounded-l-2xl rounded-r-none',
}

export function Modal({ open, onClose, children, title, className, size = 'md', centered = false }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className={cn(
      'fixed inset-0 z-50 flex justify-center p-4 sm:p-6 overflow-y-auto',
      centered ? 'items-center' : 'items-start'
    )}>
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cn(
          'relative z-10 w-full bg-white shadow-[0_24px_48px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)] max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)]',
          size === 'drawer' ? 'fixed right-0 top-0 h-full animate-slide-in rounded-l-2xl' : centered ? 'animate-fade-up rounded-2xl' : 'animate-fade-up rounded-2xl',
          sizeStyles[size],
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-[15px] font-semibold text-slate-900 font-[family-name:var(--font-heading)]">{title}</h2>
            <button onClick={onClose} className="p-1.5 -mr-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        )}
        <div className={cn(!title && 'pt-4', 'overflow-y-auto max-h-[calc(100dvh-8rem)]')}>{children}</div>
      </div>
    </div>,
    document.body
  )
}
