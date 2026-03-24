'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Goal } from '@/types'
import { mockGoals } from '@/data/mockData'

interface GoalStore {
  goals: Goal[]
  _dataVersion: number

  initializeIfNeeded: () => void

  addGoal:    (targetNodeId: string) => void
  removeGoal: (id: string) => void
  toggleGoal: (targetNodeId: string) => void
  isGoal:     (nodeId: string) => boolean
  getGoalForNode: (nodeId: string) => Goal | undefined
}

const safeStorage = createJSONStorage(() =>
  typeof window !== 'undefined'
    ? localStorage
    : ({ getItem: () => null, setItem: () => {}, removeItem: () => {} } as unknown as Storage)
)

export const useGoalStore = create<GoalStore>()(
  persist(
    (set, get) => ({
      goals:        [],
      _dataVersion: 0,

      initializeIfNeeded: () => {
        if (get()._dataVersion === 0) {
          set({ goals: mockGoals, _dataVersion: 1 })
        }
      },

      addGoal: (targetNodeId) => {
        if (get().goals.some(g => g.targetNodeId === targetNodeId)) return
        const goal: Goal = {
          id:          crypto.randomUUID(),
          targetNodeId,
          createdAt:   new Date().toISOString(),
        }
        set(s => ({ goals: [goal, ...s.goals] }))
      },

      removeGoal: (id) =>
        set(s => ({ goals: s.goals.filter(g => g.id !== id) })),

      toggleGoal: (targetNodeId) => {
        const existing = get().goals.find(g => g.targetNodeId === targetNodeId)
        if (existing) {
          set(s => ({ goals: s.goals.filter(g => g.targetNodeId !== targetNodeId) }))
        } else {
          get().addGoal(targetNodeId)
        }
      },

      isGoal:         (nodeId) => get().goals.some(g => g.targetNodeId === nodeId),
      getGoalForNode: (nodeId) => get().goals.find(g => g.targetNodeId === nodeId),
    }),
    {
      name:          'atm10-goals-v1',
      storage:       safeStorage,
      skipHydration: true,
      partialize: (s) => ({
        goals:        s.goals,
        _dataVersion: s._dataVersion,
      }),
    }
  )
)
