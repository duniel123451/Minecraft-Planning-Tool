'use client'

import { isRichTextEmpty, sanitizeRichText } from '@/lib/richText'

interface RichTextViewerProps {
  value: string
  className?: string
  size?: 'sm' | 'xs'
}

export function RichTextViewer({ value, className = '', size = 'sm' }: RichTextViewerProps) {
  if (!value) return null
  const safeHtml = sanitizeRichText(value)
  if (isRichTextEmpty(safeHtml)) return null

  return (
    <div
      className={`rich-text ${size === 'xs' ? 'text-xs' : 'text-sm'} leading-relaxed text-gray-600 dark:text-slate-300 ${className}`}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  )
}
