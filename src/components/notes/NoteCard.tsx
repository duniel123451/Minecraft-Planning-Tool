'use client'

import { useState } from 'react'
import { Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { RichTextViewer } from '@/components/ui/RichTextViewer'
import { NoteImage } from './NoteImage'
import type { NoteNode } from '@/types/note'
import { getNodeTitle, type LinkableNode } from '@/types'
import { getRichTextPreview } from '@/lib/richText'

const nodeEmoji: Record<string, string> = {
  quest: '📋',
  item: '📦',
  building: '🏗️',
  note: '📝',
}

interface NoteCardProps {
  note: NoteNode
  linkableNodes: LinkableNode[]
  notes: NoteNode[]
  onEdit:   (note: NoteNode) => void
  onDelete: (id: string) => void
}

export function NoteCard({ note, linkableNodes, notes, onEdit, onDelete }: NoteCardProps) {
  const [expanded, setExpanded] = useState(false)

  const linkedNodes = note.links
    .map(link => linkableNodes.find(n => n.id === link.targetId))
    .filter((n): n is LinkableNode => !!n)

  const backlinks = notes
    .filter(n => n.id !== note.id && n.links.some(link => link.targetId === note.id))

  const preview = getRichTextPreview(note.content, 180)

  const date = new Date(note.updatedAt).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  })

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-rose-100 dark:border-slate-700 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <button
          className="flex-1 text-left"
          onClick={() => setExpanded(e => !e)}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">📝</span>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100 leading-tight">{note.title}</h3>
            {expanded ? <ChevronUp size={13} className="text-gray-400 ml-auto flex-shrink-0" /> : <ChevronDown size={13} className="text-gray-400 ml-auto flex-shrink-0" />}
          </div>
        </button>
        <div className="flex gap-1 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => onEdit(note)} className="!p-1.5">
            <Pencil size={13} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(note.id)} className="!p-1.5 hover:text-red-400">
            <Trash2 size={13} />
          </Button>
        </div>
      </div>

      {/* Content preview / full */}
      {preview && !expanded && (
        <p className="mt-2 text-xs text-gray-600 dark:text-slate-400 line-clamp-3">{preview}</p>
      )}
      {expanded && note.content && (
        <div className="mt-3">
          <RichTextViewer value={note.content} />
        </div>
      )}

      {/* Images (only when expanded or if few) */}
      {note.images.length > 0 && expanded && (
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
          {note.images.map((ref, i) => (
            <div key={i} className="flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden border border-rose-100 dark:border-slate-600">
              <NoteImage imageRef={ref} alt={`Bild ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {note.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full text-xs font-medium bg-pink-50 dark:bg-pink-950 text-pink-500 dark:text-pink-400"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Linked nodes */}
      {linkedNodes.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1">Verknüpft ({linkedNodes.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {linkedNodes.map(node => (
              <span
                key={node.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs bg-rose-50 dark:bg-slate-700 text-gray-600 dark:text-slate-300"
              >
                <span>{nodeEmoji[node.type] ?? '🔗'}</span>
                <span className="truncate max-w-24">{getNodeTitle(node)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Backlinks */}
      {backlinks.length > 0 && (
        <div className="mt-3 border-t border-rose-50 dark:border-slate-700 pt-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1">Verlinkt von ({backlinks.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {backlinks.map(bl => (
              <span
                key={bl.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-violet-50 dark:bg-slate-700 text-violet-600 dark:text-violet-300"
              >
                📝 {bl.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer: image count + date */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-400 dark:text-slate-500">
        <div className="flex items-center gap-2">
          {note.images.length > 0 && (
            <span>🖼️ {note.images.length}</span>
          )}
        </div>
        <span>{date}</span>
      </div>
    </div>
  )
}
