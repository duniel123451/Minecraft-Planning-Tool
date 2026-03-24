'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Quest, QuestStatus, QuestCategory, QuestPriority } from '@/types'
import { mockQuests } from '@/data/mockData'

interface QuestStore {
  quests: Quest[]
  addQuest: (quest: Omit<Quest, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateQuest: (id: string, updates: Partial<Quest>) => void
  deleteQuest: (id: string) => void
  getQuestById: (id: string) => Quest | undefined
  getChildren: (parentId: string) => Quest[]
  getDependencies: (id: string) => Quest[]
  canStart: (id: string) => boolean
}

const safeStorage = createJSONStorage(() => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    } as unknown as Storage
  }
  return localStorage
})

export const useQuestStore = create<QuestStore>()(
  persist(
    (set, get) => ({
      quests: mockQuests,

      addQuest: (questData) => {
        const now = new Date().toISOString()
        const quest: Quest = {
          ...questData,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ quests: [quest, ...state.quests] }))
      },

      updateQuest: (id, updates) => {
        set((state) => ({
          quests: state.quests.map((q) =>
            q.id === id
              ? { ...q, ...updates, updatedAt: new Date().toISOString() }
              : q
          ),
        }))
      },

      deleteQuest: (id) => {
        set((state) => ({
          quests: state.quests
            .filter((q) => q.id !== id)
            .map((q) => ({
              ...q,
              dependsOn: q.dependsOn.filter((depId) => depId !== id),
              parentId: q.parentId === id ? null : q.parentId,
            })),
        }))
      },

      getQuestById: (id) => get().quests.find((q) => q.id === id),

      getChildren: (parentId) =>
        get().quests.filter((q) => q.parentId === parentId),

      getDependencies: (id) => {
        const quest = get().quests.find((q) => q.id === id)
        if (!quest) return []
        return quest.dependsOn
          .map((depId) => get().quests.find((q) => q.id === depId))
          .filter(Boolean) as Quest[]
      },

      canStart: (id) => {
        const quest = get().quests.find((q) => q.id === id)
        if (!quest) return false
        if (quest.dependsOn.length === 0) return true
        const deps = get().getDependencies(id)
        return deps.every((dep) => dep.status === 'done')
      },
    }),
    {
      name: 'atm10-quests',
      storage: safeStorage,
      skipHydration: true,
    }
  )
)
