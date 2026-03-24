'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Building } from '@/types'
import { mockBuildings } from '@/data/mockData'

interface BuildingStore {
  buildings: Building[]
  addBuilding: (building: Omit<Building, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateBuilding: (id: string, updates: Partial<Building>) => void
  deleteBuilding: (id: string) => void
  getBuildingById: (id: string) => Building | undefined
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

export const useBuildingStore = create<BuildingStore>()(
  persist(
    (set, get) => ({
      buildings: mockBuildings,

      addBuilding: (buildingData) => {
        const now = new Date().toISOString()
        const building: Building = {
          ...buildingData,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ buildings: [building, ...state.buildings] }))
      },

      updateBuilding: (id, updates) => {
        set((state) => ({
          buildings: state.buildings.map((b) =>
            b.id === id
              ? { ...b, ...updates, updatedAt: new Date().toISOString() }
              : b
          ),
        }))
      },

      deleteBuilding: (id) => {
        set((state) => ({
          buildings: state.buildings.filter((b) => b.id !== id),
        }))
      },

      getBuildingById: (id) => get().buildings.find((b) => b.id === id),
    }),
    {
      name: 'atm10-buildings',
      storage: safeStorage,
      skipHydration: true,
    }
  )
)
