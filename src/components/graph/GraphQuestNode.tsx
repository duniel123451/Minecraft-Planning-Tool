'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import type { GraphNodeData } from '@/lib/graph/convert'

const categoryEmoji: Record<string, string> = {
  progression: '⭐', building: '🏗️', farming: '🌾',
  exploration: '🗺️', crafting: '🔨', automation: '⚙️', other: '📌',
}

const stateStyles: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  done:      { bg: 'bg-emerald-50',  border: 'border-emerald-300', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  available: { bg: 'bg-amber-50',    border: 'border-amber-300',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  locked:    { bg: 'bg-gray-50',     border: 'border-gray-200',    text: 'text-gray-400',    dot: 'bg-gray-300'    },
}

export const GraphQuestNode = memo(({ data }: NodeProps<Node<GraphNodeData>>) => {
  if (data.node.type !== 'quest') return null

  const quest = data.node
  const s = stateStyles[data.state]

  return (
    <div
      className={`
        w-52 rounded-2xl border-2 ${s.bg} ${s.border}
        px-3 py-2.5 shadow-sm select-none
      `}
    >
      <Handle type="target" position={Position.Left}  style={{ background: '#fda4af', border: 'none', width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: '#fda4af', border: 'none', width: 8, height: 8 }} />

      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm">{categoryEmoji[quest.category]}</span>
        <span className={`text-xs font-bold truncate ${s.text}`}>{quest.title}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
        <span className={`text-xs ${s.text}`}>
          {data.state === 'done' ? 'Erledigt' : data.state === 'available' ? 'Verfügbar' : 'Gesperrt'}
        </span>
        {quest.priority === 'high' && (
          <span className="ml-auto text-xs text-rose-400 font-bold">!</span>
        )}
      </div>
    </div>
  )
})

GraphQuestNode.displayName = 'GraphQuestNode'
