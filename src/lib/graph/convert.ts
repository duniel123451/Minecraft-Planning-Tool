import type { Node, Edge } from '@xyflow/react'
import type { AnyNode } from '@/types'
import { getNodeState, type NodeState } from '@/lib/progression'

export interface GraphNodeData {
  node: AnyNode
  state: NodeState
  [key: string]: unknown  // React Flow requires this
}

const EDGE_COLORS: Record<string, string> = {
  requires: '#f97316',   // orange
  unlocks:  '#22c55e',   // green
  related:  '#a78bfa',   // purple
}

/**
 * Convert AnyNode[] into React Flow nodes + edges.
 * Filters to only include visibleNodes, but uses allNodes for progression state.
 */
export function convertNodesToGraph(
  allNodes: AnyNode[],
  visibleNodes: AnyNode[],
): {
  nodes: Node<GraphNodeData>[]
  edges: Edge[]
} {
  const visibleSet = new Set(visibleNodes.map(n => n.id))

  const nodes: Node<GraphNodeData>[] = visibleNodes.map(node => ({
    id: node.id,
    type: node.type === 'quest' ? 'questNode' : 'itemNode',
    data: {
      node,
      state: getNodeState(node.id, allNodes),
    },
    position: { x: 0, y: 0 }, // overwritten by layout
  }))

  const edges: Edge[] = []

  visibleNodes.forEach(node => {
    node.dependencies.forEach(dep => {
      if (!visibleSet.has(dep.targetId)) return

      const depColor  = EDGE_COLORS[dep.type] ?? '#94a3b8'
      const isDone    = node.status === 'done' || node.status === 'have'

      edges.push({
        id:     `${dep.targetId}→${node.id}:${dep.type}`,
        source: dep.targetId,
        target: node.id,
        type:   'smoothstep',
        animated: dep.type === 'requires' && !isDone,
        style: {
          stroke:          depColor,
          strokeWidth:     dep.type === 'requires' ? 2 : 1,
          strokeDasharray: dep.type === 'related' ? '4 3' : undefined,
        },
        markerEnd: {
          type:  'arrowclosed',
          color: depColor,
          width: 16,
          height: 16,
        },
      })
    })
  })

  return { nodes, edges }
}

/**
 * Build edges from all dependencies (for full graph export / analysis).
 */
export function buildEdgesFromDependencies(allNodes: AnyNode[]): Edge[] {
  const edges: Edge[] = []
  allNodes.forEach(node => {
    node.dependencies.forEach(dep => {
      edges.push({
        id:     `${dep.targetId}→${node.id}:${dep.type}`,
        source: dep.targetId,
        target: node.id,
        type:   'smoothstep',
      })
    })
  })
  return edges
}
