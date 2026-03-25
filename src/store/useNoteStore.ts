'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { NoteLink, NoteNode } from '@/types/note'

interface NoteStore {
  notes: NoteNode[]
  _dataVersion: number
  lastDeleted: NoteNode | null

  initializeIfNeeded: () => void
  addNote:    (note: Omit<NoteNode, 'id' | 'type' | 'createdAt' | 'updatedAt'>) => void
  updateNote: (id: string, updates: Partial<NoteNode>) => void
  deleteNote: (id: string) => void
  undoDelete: () => void
  getNoteById: (id: string) => NoteNode | undefined
}

const DATA_VERSION = 2

const sanitizeLinks = (links: NoteLink[] | undefined, fallbackDate?: string): NoteLink[] => {
  if (!links || links.length === 0) return []
  const seen = new Set<string>()
  return links.reduce<NoteLink[]>((acc, link) => {
    if (!link?.targetId) return acc
    if (seen.has(link.targetId)) return acc
    seen.add(link.targetId)
    acc.push({
      targetId: link.targetId,
      addedAt: link.addedAt ?? fallbackDate ?? new Date().toISOString(),
    })
    return acc
  }, [])
}

const safeStorage = createJSONStorage(() =>
  typeof window !== 'undefined'
    ? localStorage
    : ({ getItem: () => null, setItem: () => {}, removeItem: () => {} } as unknown as Storage)
)

export const useNoteStore = create<NoteStore>()(
  persist(
    (set, get) => ({
      notes:        [],
      _dataVersion: 0,
      lastDeleted:  null,

      initializeIfNeeded: () => {
        if (get()._dataVersion === 0) {
          set({ _dataVersion: DATA_VERSION })
        }
      },

      addNote: (data) => {
        const now = new Date().toISOString()
        const note: NoteNode = {
          ...data,
          type:      'note',
          links:     sanitizeLinks(data.links, now),
          id:        crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        }
        set(s => ({ notes: [note, ...s.notes] }))
      },

      updateNote: (id, updates) =>
        set(s => ({
          notes: s.notes.map(n =>
            n.id === id
              ? {
                  ...n,
                  ...updates,
                  links: updates.links ? sanitizeLinks(updates.links, new Date().toISOString()) : n.links,
                  updatedAt: new Date().toISOString(),
                }
              : n
          ),
        })),

      deleteNote: (id) => {
        const target = get().notes.find(n => n.id === id) ?? null
        set(s => ({
          lastDeleted: target,
          notes: s.notes
            .filter(n => n.id !== id)
            .map(n => ({
              ...n,
              links: n.links.filter(link => link.targetId !== id),
            })),
        }))
      },

      undoDelete: () => {
        const { lastDeleted } = get()
        if (lastDeleted) {
          set(s => ({ notes: [lastDeleted, ...s.notes], lastDeleted: null }))
        }
      },

      getNoteById: (id) => get().notes.find(n => n.id === id),
    }),
    {
      name:          'atm10-notes-v1',
      storage:       safeStorage,
      skipHydration: true,
      partialize: (s) => ({
        notes:        s.notes,
        _dataVersion: s._dataVersion,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const migrated = state.notes.map(note => {
          const fallbackTimestamp = note.updatedAt ?? note.createdAt ?? new Date().toISOString()
          const legacyIds = Array.isArray((note as unknown as { linkedNodeIds?: string[] }).linkedNodeIds)
            ? (note as unknown as { linkedNodeIds: string[] }).linkedNodeIds
            : []
          const legacyLinks: NoteLink[] = legacyIds.map(id => ({ targetId: id, addedAt: fallbackTimestamp }))
          const normalized = sanitizeLinks((note as NoteNode).links ?? legacyLinks, fallbackTimestamp)
          return {
            ...note,
            type:  (note as NoteNode).type ?? 'note',
            links: normalized,
          }
        })
        state.notes = migrated
        state._dataVersion = DATA_VERSION
      },
    }
  )
)
