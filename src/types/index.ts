// ─── Quest System ────────────────────────────────────────────────────────────

export type QuestStatus = 'open' | 'in-progress' | 'done'
export type QuestPriority = 'low' | 'medium' | 'high'
export type QuestCategory =
  | 'progression'
  | 'building'
  | 'farming'
  | 'exploration'
  | 'crafting'
  | 'automation'
  | 'other'

export interface Quest {
  id: string
  title: string
  description: string
  status: QuestStatus
  priority: QuestPriority
  category: QuestCategory
  parentId: string | null       // for nested questlines
  dependsOn: string[]           // IDs of quests that must be 'done' first
  notes: string
  createdAt: string
  updatedAt: string
}

// ─── Building Planner ─────────────────────────────────────────────────────────

export type BuildingStatus = 'planned' | 'in-progress' | 'done'

export interface Building {
  id: string
  name: string
  location: string
  style: string
  status: BuildingStatus
  requirements: string[]
  inspoPics: string[]           // URLs or empty
  notes: string
  createdAt: string
  updatedAt: string
}

// ─── Item System ──────────────────────────────────────────────────────────────

export type ItemStatus = 'needed' | 'collecting' | 'have'

export interface Ingredient {
  name: string
  amount: number
  unit?: string
}

export interface Item {
  id: string
  name: string
  mod: string
  status: ItemStatus
  reason: string          // why I need this item
  purpose: string         // what it's used for
  ingredients: Ingredient[]
  linkedItemIds: string[] // related item IDs
  notes: string
  createdAt: string
  updatedAt: string
}
