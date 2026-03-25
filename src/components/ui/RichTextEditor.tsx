'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import type { ReactQuillProps } from 'react-quill'
import { sanitizeRichText } from '@/lib/richText'

const QuillEditor = dynamic<ReactQuillProps>(async () => {
  const mod = await import('react-quill')
  return mod.default
}, {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-rose-100 dark:border-slate-700 bg-white/60 dark:bg-slate-800/40 h-32 animate-pulse" />
  ),
})

const toolbarModules: ReactQuillProps['modules'] = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
  ],
  clipboard: { matchVisual: false },
}

const toolbarFormats: ReactQuillProps['formats'] = ['bold', 'italic', 'underline', 'list', 'bullet', 'link']

interface RichTextEditorProps {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  helperText?: string
  className?: string
}

export function RichTextEditor({ label, value, onChange, placeholder, helperText, className = '' }: RichTextEditorProps) {
  const safeValue = useMemo(() => value || '', [value])

  const handleChange = (content: string) => {
    const cleaned = sanitizeRichText(content)
    if (cleaned === '<p><br></p>' || cleaned === '<p></p>') {
      onChange('')
      return
    }
    onChange(cleaned)
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-slate-300">{label}</label>
      )}
      <div className="rich-text-editor rounded-2xl border border-rose-200 dark:border-slate-600 bg-white dark:bg-slate-900">
        <QuillEditor
          theme="snow"
          value={safeValue}
          onChange={handleChange}
          placeholder={placeholder}
          modules={toolbarModules}
          formats={toolbarFormats}
        />
      </div>
      {helperText && <p className="text-xs text-gray-400 dark:text-slate-500">{helperText}</p>}
    </div>
  )
}
