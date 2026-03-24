// ─── Shared Graph Types ───────────────────────────────────────────────────────

export interface Dependency {
  targetId: string
  type: 'requires' | 'unlocks' | 'related'
}

// ─── Quest ────────────────────────────────────────────────────────────────────

export type QuestStatus   = 'open' | 'in-progress' | 'done'
export type QuestPriority = 'low' | 'medium' | 'high'
export type QuestCategory =
  | 'progression' | 'building' | 'farming'
  | 'exploration' | 'crafting' | 'automation' | 'other'

export interface QuestNode {
  id: string
  type: 'quest'
  title: string
  description: string
  status: QuestStatus
  priority: QuestPriority
  category: QuestCategory
  parentId: string | null
  dependencies: Dependency[]   // replaces dependsOn + linkedIds
  notes: string
  createdAt: string
  updatedAt: string
}

// ─── Item ─────────────────────────────────────────────────────────────────────

export type ItemStatus = 'needed' | 'collecting' | 'have'

export interface Ingredient {
  name: string
  amount: number
  unit?: string
}

export interface ItemNode {
  id: string
  type: 'item'
  name: string               // display name
  mod: string
  status: ItemStatus
  reason: string
  purpose: string
  ingredients: Ingredient[]  // text-based recipe for display
  dependencies: Dependency[] // node-level links (requires/related)
  notes: string
  createdAt: string
  updatedAt: string
}

export type AnyNode = QuestNode | ItemNode

// ─── Building (not in graph) ──────────────────────────────────────────────────

export type BuildingStatus = 'planned' | 'in-progress' | 'done'

export interface Building {
  id: string
  name: string
  location: string
  style: string
  status: BuildingStatus
  requirements: string[]
  inspoPics: string[]
  notes: string
  createdAt: string
  updatedAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getNodeTitle(node: AnyNode): string {
  return node.type === 'quest' ? node.title : node.name
}

export function isNodeDone(node: AnyNode): boolean {
  return node.status === 'done' || node.status === 'have'
}
