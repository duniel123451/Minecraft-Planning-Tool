'use client'

import React, { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { GraphQuestNode } from './GraphQuestNode'
import { GraphItemNode }  from './GraphItemNode'
import type { GraphNodeData } from '@/lib/graph/convert'
import type { AnyNode } from '@/types'

const nodeTypes: NodeTypes = {
  questNode: GraphQuestNode as any,
  itemNode:  GraphItemNode  as any,
}

const stateColor: Record<string, string> = {
  done:      '#34d399',
  available: '#fbbf24',
  locked:    '#d1d5db',
}

interface GraphViewProps {
  nodes: Node<GraphNodeData>[]
  edges: Edge[]
  onNodeClick?: (node: AnyNode) => void
}

export function GraphView({ nodes: initNodes, edges: initEdges, onNodeClick }: GraphViewProps) {
  const [nodes, , onNodesChange] = useNodesState(initNodes)
  const [edges, , onEdgesChange] = useEdgesState(initEdges)

  // Sync external changes
  const syncedNodes = useMemo(() => initNodes, [initNodes])
  const syncedEdges = useMemo(() => initEdges, [initEdges])

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const data = node.data as GraphNodeData
      onNodeClick?.(data.node)
    },
    [onNodeClick]
  )

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={syncedNodes}
        edges={syncedEdges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#fda4af" gap={20} size={1} style={{ opacity: 0.2 }} />
        <Controls
          style={{ borderRadius: 12, border: '1px solid #fecdd3', overflow: 'hidden' }}
        />
        <MiniMap
          nodeColor={(n) => {
            const d = n.data as GraphNodeData
            return stateColor[d?.state ?? 'locked']
          }}
          style={{
            borderRadius: 12,
            border: '1px solid #fecdd3',
          }}
          maskColor="rgba(255,241,242,0.7)"
        />
      </ReactFlow>
    </div>
  )
}
