'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, List } from 'lucide-react'
import { useEffect } from 'react'

interface RichTextEditorProps {
  value:    string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

export function RichTextEditor({ value, onChange, placeholder, minHeight = 120 }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content:    value || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      // Treat empty editor as empty string
      onChange(html === '<p></p>' ? '' : html)
    },
    editorProps: {
      attributes: {
        class: 'outline-none',
      },
    },
  })

  // Sync external value changes (e.g. form reset)
  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() !== value && value !== undefined) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  if (!editor) return null

  return (
    <div className="rounded-xl border border-rose-200 dark:border-slate-600 bg-white dark:bg-slate-800 overflow-hidden focus-within:border-pink-400 focus-within:ring-2 focus-within:ring-pink-100 dark:focus-within:ring-pink-900 transition-colors">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-rose-100 dark:border-slate-700">
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBold().run() }}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-400' : 'text-gray-400 dark:text-slate-500 hover:bg-rose-50 dark:hover:bg-slate-700 hover:text-gray-600 dark:hover:text-slate-300'}`}
          title="Fett (Ctrl+B)"
        >
          <Bold size={13} />
        </button>
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-400' : 'text-gray-400 dark:text-slate-500 hover:bg-rose-50 dark:hover:bg-slate-700 hover:text-gray-600 dark:hover:text-slate-300'}`}
          title="Kursiv (Ctrl+I)"
        >
          <Italic size={13} />
        </button>
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBulletList().run() }}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('bulletList') ? 'bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-400' : 'text-gray-400 dark:text-slate-500 hover:bg-rose-50 dark:hover:bg-slate-700 hover:text-gray-600 dark:hover:text-slate-300'}`}
          title="Aufzählung"
        >
          <List size={13} />
        </button>
      </div>

      {/* Editor */}
      <div
        className="relative px-3 py-2 text-sm text-gray-800 dark:text-slate-100"
        style={{ minHeight }}
        onClick={() => editor.commands.focus()}
      >
        {/* Placeholder */}
        {editor.isEmpty && placeholder && (
          <span className="absolute top-2 left-3 text-sm text-gray-400 dark:text-slate-500 pointer-events-none select-none">
            {placeholder}
          </span>
        )}
        <EditorContent editor={editor} className="rich-content" />
      </div>
    </div>
  )
}
