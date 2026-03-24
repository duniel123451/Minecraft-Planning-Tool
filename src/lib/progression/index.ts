/**
 * Core progression logic – pure functions, no UI, no store imports.
 * Operates on AnyNode[] as the source of truth.
 */

import type { AnyNode } from '@/types'

// ─── Unlocked State ───────────────────────────────────────────────────────────

/**
 * A node is unlocked when ALL its 'requires' dependencies are done.
 * Nodes with no 'requires' deps are always unlocked.
 */
export function isUnlocked(nodeId: string, allNodes: AnyNode[]): boolean {
  const node = allNodes.find(n => n.id === nodeId)
  if (!node) return false

  const required = node.dependencies.filter(d => d.type === 'requires')
  if (required.length === 0) return true

  return required.every(dep => {
    const depNode = allNodes.find(n => n.id === dep.targetId)
    if (!depNode) return true // missing dep → don't block
    return depNode.status === 'done' || depNode.status === 'have'
  })
}

// ─── Blocked Dependencies ─────────────────────────────────────────────────────

/**
 * Returns the nodes that are blocking the given node
 * (required deps that are not yet done).
 */
export function getBlockedDependencies(nodeId: string, allNodes: AnyNode[]): AnyNode[] {
  const node = allNodes.find(n => n.id === nodeId)
  if (!node) return []

  return node.dependencies
    .filter(d => d.type === 'requires')
    .map(d => allNodes.find(n => n.id === d.targetId))
    .filter((n): n is AnyNode => {
      if (!n) return false
      return n.status !== 'done' && n.status !== 'have'
    })
}

// ─── Available Nodes ──────────────────────────────────────────────────────────

/**
 * Returns nodes that are unlocked but not yet done.
 * These are the "actionable" nodes the user should work on.
 */
export function getAvailableNodes(allNodes: AnyNode[]): AnyNode[] {
  return allNodes.filter(node => {
    const isDone = node.status === 'done' || node.status === 'have'
    return !isDone && isUnlocked(node.id, allNodes)
  })
}

// ─── Dependency Chain ─────────────────────────────────────────────────────────

/**
 * Returns the ordered list of nodes that must be completed
 * before the given node can start. Sorted from earliest to latest.
 * Does NOT include the node itself.
 */
export function getDependencyChain(nodeId: string, allNodes: AnyNode[]): AnyNode[] {
  const visited = new Set<string>()
  const chain: AnyNode[] = []

  function traverse(id: string) {
    if (visited.has(id) || id === nodeId) return
    visited.add(id)

    const node = allNodes.find(n => n.id === id)
    if (!node) return

    // Visit deps first (depth-first)
    node.dependencies
      .filter(d => d.type === 'requires')
      .forEach(d => traverse(d.targetId))

    chain.push(node)
  }

  const root = allNodes.find(n => n.id === nodeId)
  if (root) {
    root.dependencies
      .filter(d => d.type === 'requires')
      .forEach(d => traverse(d.targetId))
  }

  return chain
}

// ─── Full Dependency Tree ─────────────────────────────────────────────────────

/**
 * Recursively returns ALL nodes in the dependency tree of the given node
 * (all transitive dependencies, not just direct ones).
 * Useful for items: getFullDependencyTree(itemId) gives you everything
 * you need to craft/collect first.
 */
export function getFullDependencyTree(nodeId: string, allNodes: AnyNode[]): AnyNode[] {
  const visited = new Set<string>()
  const tree: AnyNode[] = []

  function traverse(id: string) {
    if (visited.has(id)) return
    visited.add(id)

    const node = allNodes.find(n => n.id === id)
    if (!node) return

    tree.push(node)

    node.dependencies
      .filter(d => d.type === 'requires')
      .forEach(d => traverse(d.targetId))
  }

  const root = allNodes.find(n => n.id === nodeId)
  if (root) {
    root.dependencies
      .filter(d => d.type === 'requires')
      .forEach(d => traverse(d.targetId))
  }

  return tree
}

// ─── Unlocked By ─────────────────────────────────────────────────────────────

/**
 * Returns nodes that will become available once the given node is completed.
 * i.e. nodes that have this node as a 'requires' dependency.
 */
export function getUnlockedBy(nodeId: string, allNodes: AnyNode[]): AnyNode[] {
  return allNodes.filter(n =>
    n.id !== nodeId &&
    n.dependencies.some(d => d.targetId === nodeId && d.type === 'requires')
  )
}

// ─── Visual State ─────────────────────────────────────────────────────────────

export type NodeState = 'done' | 'available' | 'locked'

export function getNodeState(nodeId: string, allNodes: AnyNode[]): NodeState {
  const node = allNodes.find(n => n.id === nodeId)
  if (!node) return 'locked'

  if (node.status === 'done' || node.status === 'have') return 'done'
  if (isUnlocked(nodeId, allNodes)) return 'available'
  return 'locked'
}
