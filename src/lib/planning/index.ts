/**
 * Planning & decision logic – pure functions, no UI, no store imports.
 * All functions operate on AnyNode[] + goalNodeId.
 */

import type { AnyNode } from '@/types'
import { isNodeDone } from '@/types'
import { isUnlocked, getNodeState } from '@/lib/progression'

// ─── Required Nodes ───────────────────────────────────────────────────────────

/**
 * Returns ALL nodes transitively required to complete a goal node.
 * Does NOT include the goal itself.
 */
export function getRequiredNodesForGoal(goalNodeId: string, allNodes: AnyNode[]): AnyNode[] {
  const visited = new Set<string>()
  const required: AnyNode[] = []

  function traverse(id: string) {
    if (visited.has(id) || id === goalNodeId) return
    visited.add(id)

    const node = allNodes.find(n => n.id === id)
    if (!node) return

    required.push(node)

    node.dependencies
      .filter(d => d.type === 'requires')
      .forEach(d => traverse(d.targetId))
  }

  const goal = allNodes.find(n => n.id === goalNodeId)
  if (goal) {
    goal.dependencies
      .filter(d => d.type === 'requires')
      .forEach(d => traverse(d.targetId))
  }

  return required
}

// ─── Next Steps ───────────────────────────────────────────────────────────────

/**
 * Returns nodes in the goal's required set that are:
 * - NOT done yet
 * - Currently UNLOCKED (all their own deps are satisfied)
 *
 * These are what the user should work on RIGHT NOW.
 */
export function getNextStepsForGoal(goalNodeId: string, allNodes: AnyNode[]): AnyNode[] {
  const required = getRequiredNodesForGoal(goalNodeId, allNodes)
  return required.filter(node => {
    if (isNodeDone(node)) return false
    return isUnlocked(node.id, allNodes)
  })
}

// ─── Blocking Nodes ───────────────────────────────────────────────────────────

/**
 * Returns nodes in the goal's required set that are:
 * - NOT done
 * - LOCKED (still waiting for their own deps)
 *
 * These are what's blocking progress.
 */
export function getBlockingNodesForGoal(goalNodeId: string, allNodes: AnyNode[]): AnyNode[] {
  const required = getRequiredNodesForGoal(goalNodeId, allNodes)
  return required.filter(node => {
    if (isNodeDone(node)) return false
    return getNodeState(node.id, allNodes) === 'locked'
  })
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export interface GoalProgress {
  total: number
  done: number
  available: number
  locked: number
  percent: number
}

export function getGoalProgress(goalNodeId: string, allNodes: AnyNode[]): GoalProgress {
  const required = getRequiredNodesForGoal(goalNodeId, allNodes)

  // Also count the goal node itself
  const goalNode = allNodes.find(n => n.id === goalNodeId)
  const all = goalNode ? [goalNode, ...required] : required

  const done      = all.filter(n => isNodeDone(n)).length
  const available = all.filter(n => !isNodeDone(n) && getNodeState(n.id, allNodes) === 'available').length
  const locked    = all.filter(n => !isNodeDone(n) && getNodeState(n.id, allNodes) === 'locked').length
  const total     = all.length

  return {
    total,
    done,
    available,
    locked,
    percent: total > 0 ? Math.round((done / total) * 100) : 0,
  }
}

// ─── Resource Calculation ─────────────────────────────────────────────────────

export interface ResourceRequirement {
  nodeId: string
  node: AnyNode
  totalAmount: number
  isDone: boolean
}

/**
 * Calculates the total raw-material requirements for a goal.
 * Traverses the full crafting dependency tree and multiplies amounts upward.
 *
 * Example: ME Controller needs 8x Fluix Crystal, each Fluix Crystal needs
 * 1x Certus Quartz Seed → total Certus Quartz Seeds needed: 8.
 */
export function calculateTotalResources(
  goalNodeId: string,
  allNodes: AnyNode[],
): ResourceRequirement[] {
  const totals = new Map<string, number>() // nodeId → aggregated amount

  const visited = new Set<string>() // prevent infinite loops (cycles)

  function traverse(id: string, multiplier: number) {
    if (visited.has(id)) return
    visited.add(id)

    const node = allNodes.find(n => n.id === id)
    if (!node) return

    node.dependencies
      .filter(d => d.type === 'requires')
      .forEach(dep => {
        const needed = (dep.amount ?? 1) * multiplier
        totals.set(dep.targetId, (totals.get(dep.targetId) ?? 0) + needed)
        traverse(dep.targetId, needed)
      })

    visited.delete(id) // allow re-visiting from different paths (DAG, not tree)
  }

  traverse(goalNodeId, 1)

  return Array.from(totals.entries())
    .map(([nodeId, totalAmount]) => {
      const node = allNodes.find(n => n.id === nodeId)
      if (!node) return null
      return { nodeId, node, totalAmount, isDone: isNodeDone(node) }
    })
    .filter((r): r is ResourceRequirement => r !== null)
    .sort((a, b) => (a.isDone ? 1 : 0) - (b.isDone ? 1 : 0)) // undone first
}
