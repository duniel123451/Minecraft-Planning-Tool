'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import type { GraphNodeData } from '@/lib/graph/convert'
import type { NoteNode } from '@/types/note'
import { useNoteImage } from '@/hooks/useNoteImage'

function NoteImagePreview({ imageKey }: { imageKey: string }) {
  const url = useNoteImage(imageKey)
  if (!url) {
    return (
      <div className="w-full h-32 bg-amber-100 flex items-center justify-center rounded-t-xl">
        <span className="text-2xl opacity-30">🖼️</span>
      </div>
    )
  }
  return (
    <img
      src={url}
      alt=""
      className="w-full h-32 object-cover rounded-t-xl"
      draggable={false}
    />
  )
}

export const GraphNoteNode = memo(({ data }: NodeProps<Node<GraphNodeData>>) => {
  const note = data.node as NoteNode
  if (note.type !== 'note') return null

  const hasImages = note.images.length > 0
  const firstKey  = hasImages ? note.images[0] : null
  const snippet   = note.content.replace(/[#*_`[\]]/g, '').trim().slice(0, 90)

  return (
    <div className="relative w-60 rounded-xl border-2 border-amber-300 bg-amber-50 shadow-sm select-none overflow-hidden">
      <Handle
        type="target"
        position={Position.Left}
        id="body"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          transform: 'none', borderRadius: '11px',
          background: 'transparent', border: 'none',
          opacity: 0, zIndex: 0, pointerEvents: 'none',
        }}
      />
      <Handle type="target" position={Position.Left}  style={{ background: '#fcd34d', border: '2px solid #f59e0b', width: 12, height: 12, cursor: 'crosshair' }} />
      <Handle type="source" position={Position.Right} style={{ background: '#fcd34d', border: '2px solid #f59e0b', width: 12, height: 12, cursor: 'crosshair' }} />

      {/* Image preview */}
      {firstKey && <NoteImagePreview imageKey={firstKey} />}

      {/* Content */}
      <div className={`px-3 ${hasImages ? 'py-2' : 'pt-2.5 pb-2'}`}>
        {!hasImages && (
          <span className="text-base leading-none block mb-1">📝</span>
        )}
        <p className="text-xs font-bold text-amber-900 truncate leading-snug">
          {note.title || 'Notiz'}
        </p>
        {!hasImages && snippet && (
          <p className="text-[11px] text-amber-800/60 mt-0.5 line-clamp-2 leading-snug">
            {snippet}
          </p>
        )}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {note.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-700 font-medium">
                #{tag}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="text-[10px] text-amber-500 self-center">+{note.tags.length - 3}</span>
            )}
          </div>
        )}
        {note.images.length > 1 && (
          <p className="text-[10px] text-amber-500 mt-1">+{note.images.length - 1} weitere Bilder</p>
        )}
      </div>
    </div>
  )
})

GraphNoteNode.displayName = 'GraphNoteNode'
