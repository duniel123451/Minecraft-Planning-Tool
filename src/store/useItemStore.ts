'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Item } from '@/types'
import { mockItems } from '@/data/mockData'

interface ItemStore {
  items: Item[]
  addItem: (item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateItem: (id: string, updates: Partial<Item>) => void
  deleteItem: (id: string) => void
  getItemById: (id: string) => Item | undefined
  getLinkedItems: (id: string) => Item[]
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

export const useItemStore = create<ItemStore>()(
  persist(
    (set, get) => ({
      items: mockItems,

      addItem: (itemData) => {
        const now = new Date().toISOString()
        const item: Item = {
          ...itemData,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ items: [item, ...state.items] }))
      },

      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id
              ? { ...i, ...updates, updatedAt: new Date().toISOString() }
              : i
          ),
        }))
      },

      deleteItem: (id) => {
        set((state) => ({
          items: state.items
            .filter((i) => i.id !== id)
            .map((i) => ({
              ...i,
              linkedItemIds: i.linkedItemIds.filter((lid) => lid !== id),
            })),
        }))
      },

      getItemById: (id) => get().items.find((i) => i.id === id),

      getLinkedItems: (id) => {
        const item = get().items.find((i) => i.id === id)
        if (!item) return []
        return item.linkedItemIds
          .map((lid) => get().items.find((i) => i.id === lid))
          .filter(Boolean) as Item[]
      },
    }),
    {
      name: 'atm10-items',
      storage: safeStorage,
      skipHydration: true,
    }
  )
)
