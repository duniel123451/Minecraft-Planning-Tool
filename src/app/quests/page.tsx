'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { useQuestStore } from '@/store/useQuestStore'
import { QuestCard } from '@/components/quests/QuestCard'
import { QuestForm } from '@/components/quests/QuestForm'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Quest, QuestStatus, QuestCategory } from '@/types'

type FilterStatus = 'all' | QuestStatus
type FilterPriority = 'all' | 'low' | 'medium' | 'high'

export default function QuestsPage() {
  const { quests, addQuest, updateQuest, deleteQuest, getDependencies, getChildren, canStart } =
    useQuestStore()

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Quest | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all')
  const [showOnlyRoots, setShowOnlyRoots] = useState(false)

  const filtered = useMemo(() => {
    return quests.filter((q) => {
      if (search && !q.title.toLowerCase().includes(search.toLowerCase())) return false
      if (filterStatus !== 'all' && q.status !== filterStatus) return false
      if (filterPriority !== 'all' && q.priority !== filterPriority) return false
      if (showOnlyRoots && q.parentId !== null) return false
      return true
    })
  }, [quests, search, filterStatus, filterPriority, showOnlyRoots])

  // Sort: high priority first, then by status
  const sorted = useMemo(() => {
    const pOrder = { high: 0, medium: 1, low: 2 }
    const sOrder = { 'in-progress': 0, open: 1, done: 2 }
    return [...filtered].sort(
      (a, b) =>
        sOrder[a.status] - sOrder[b.status] ||
        pOrder[a.priority] - pOrder[b.priority]
    )
  }, [filtered])

  const handleEdit = (quest: Quest) => {
    setEditTarget(quest)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditTarget(null)
  }

  const handleSubmit = (data: Omit<Quest, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editTarget) {
      updateQuest(editTarget.id, data)
    } else {
      addQuest(data)
    }
  }

  const statusCounts = {
    all: quests.length,
    open: quests.filter((q) => q.status === 'open').length,
    'in-progress': quests.filter((q) => q.status === 'in-progress').length,
    done: quests.filter((q) => q.status === 'done').length,
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto lg:max-w-3xl lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">📋 Quests</h1>
          <p className="text-xs text-gray-400 mt-0.5">{quests.length} insgesamt</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus size={14} />
          Neue Quest
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {(
          [
            { key: 'all', label: 'Alle' },
            { key: 'open', label: '⭕ Offen' },
            { key: 'in-progress', label: '🔄 In Arbeit' },
            { key: 'done', label: '✅ Erledigt' },
          ] as { key: FilterStatus; label: string }[]
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={`
              flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
              ${
                filterStatus === key
                  ? 'bg-pink-400 text-white'
                  : 'bg-white text-gray-500 border border-rose-100 hover:bg-rose-50'
              }
            `}
          >
            {label}
            <span className={`ml-1 ${filterStatus === key ? 'opacity-80' : 'text-gray-400'}`}>
              ({statusCounts[key]})
            </span>
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-xl border border-rose-200 px-3 py-2">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input
            className="flex-1 text-sm outline-none placeholder-gray-400 bg-transparent"
            placeholder="Quests suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-xl border border-rose-200 bg-white px-2 py-2 text-xs outline-none focus:border-pink-400"
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as FilterPriority)}
        >
          <option value="all">Alle Prio</option>
          <option value="high">Hoch</option>
          <option value="medium">Mittel</option>
          <option value="low">Niedrig</option>
        </select>
      </div>

      {/* Only root quests toggle */}
      <div className="mb-4">
        <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyRoots}
            onChange={(e) => setShowOnlyRoots(e.target.checked)}
            className="rounded accent-pink-400"
          />
          Nur Haupt-Questlines
        </label>
      </div>

      {/* Quest list */}
      {sorted.length === 0 ? (
        <EmptyState
          icon={<span>📋</span>}
          title="Keine Quests gefunden"
          description="Erstelle deine erste Quest oder passe die Filter an."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus size={14} />
              Neue Quest
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {sorted.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              dependencies={getDependencies(quest.id)}
              children={getChildren(quest.id)}
              canStart={canStart(quest.id)}
              onEdit={handleEdit}
              onDelete={deleteQuest}
              onStatusChange={(id, status) => updateQuest(id, { status })}
            />
          ))}
        </div>
      )}

      {/* Form modal */}
      <QuestForm
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleSubmit}
        initialData={editTarget}
        allQuests={quests}
      />
    </div>
  )
}
