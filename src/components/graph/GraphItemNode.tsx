'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import type { GraphNodeData } from '@/lib/graph/convert'

const stateStyles: Record<string, { bg: string; border: string; label: string; dot: string; mod: string }> = {
  done:      { bg: 'bg-emerald-50',  border: 'border-emerald-300', label: 'text-emerald-700', dot: 'bg-emerald-400', mod: 'text-emerald-400' },
  available: { bg: 'bg-purple-50',   border: 'border-purple-300',  label: 'text-purple-700',  dot: 'bg-purple-400',  mod: 'text-purple-400'  },
  locked:    { bg: 'bg-gray-50',     border: 'border-gray-200',    label: 'text-gray-400',    dot: 'bg-gray-300',    mod: 'text-gray-300'    },
}

const statusEmoji: Record<string, string> = {
  needed: '🔍', collecting: '📥', have: '✅',
}

export const GraphItemNode = memo(({ data }: NodeProps<Node<GraphNodeData>>) => {
  if (data.node.type !== 'item') return null

  const item = data.node
  const s = stateStyles[data.state]

  return (
    <div
      className={`
        w-52 rounded-2xl border-2 ${s.bg} ${s.border}
        px-3 py-2.5 shadow-sm select-none
      `}
    >
      <Handle type="target" position={Position.Left}  style={{ background: '#c4b5fd', border: 'none', width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: '#c4b5fd', border: 'none', width: 8, height: 8 }} />

      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm">{statusEmoji[item.status]}</span>
        <span className={`text-xs font-bold truncate ${s.label}`}>{item.name}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
        <span className={`text-xs truncate ${s.mod}`}>{item.mod}</span>
      </div>
    </div>
  )
})

GraphItemNode.displayName = 'GraphItemNode'
