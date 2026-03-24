'use client'

import { Pencil, Trash2, Link, ChevronRight, Lock } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Quest, QuestStatus, QuestPriority } from '@/types'

const statusConfig: Record<QuestStatus, { label: string; variant: 'gray' | 'amber' | 'green' }> = {
  open: { label: 'Offen', variant: 'gray' },
  'in-progress': { label: 'In Arbeit', variant: 'amber' },
  done: { label: 'Erledigt ✓', variant: 'green' },
}

const priorityConfig: Record<QuestPriority, { label: string; variant: 'gray' | 'amber' | 'red' }> = {
  low: { label: 'Niedrig', variant: 'gray' },
  medium: { label: 'Mittel', variant: 'amber' },
  high: { label: 'Hoch', variant: 'red' },
}

const categoryEmoji: Record<string, string> = {
  progression: '⭐',
  building: '🏗️',
  farming: '🌾',
  exploration: '🗺️',
  crafting: '🔨',
  automation: '⚙️',
  other: '📌',
}

interface QuestCardProps {
  quest: Quest
  dependencies: Quest[]
  children?: Quest[]
  canStart: boolean
  onEdit: (quest: Quest) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: QuestStatus) => void
}

export function QuestCard({
  quest,
  dependencies,
  children = [],
  canStart,
  onEdit,
  onDelete,
  onStatusChange,
}: QuestCardProps) {
  const status = statusConfig[quest.status]
  const priority = priorityConfig[quest.priority]
  const isBlocked = !canStart && quest.status === 'open'

  return (
    <div
      className={`
        bg-white rounded-2xl border p-4 shadow-sm transition-all duration-200
        ${quest.status === 'done' ? 'border-emerald-100 opacity-75' : 'border-rose-100'}
        ${isBlocked ? 'opacity-60' : ''}
      `}
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        {/* Status checkbox */}
        <button
          onClick={() => {
            const next: QuestStatus =
              quest.status === 'open'
                ? 'in-progress'
                : quest.status === 'in-progress'
                ? 'done'
                : 'open'
            onStatusChange(quest.id, next)
          }}
          className={`
            mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
            transition-colors duration-150 cursor-pointer
            ${
              quest.status === 'done'
                ? 'bg-emerald-400 border-emerald-400 text-white'
                : quest.status === 'in-progress'
                ? 'bg-amber-300 border-amber-300'
                : 'border-gray-300 hover:border-pink-400'
            }
          `}
        >
          {quest.status === 'done' && <span className="text-white text-xs">✓</span>}
          {quest.status === 'in-progress' && <span className="w-2 h-2 rounded-full bg-white" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm">{categoryEmoji[quest.category]}</span>
            <h3
              className={`text-sm font-semibold text-gray-800 ${
                quest.status === 'done' ? 'line-through text-gray-400' : ''
              }`}
            >
              {quest.title}
            </h3>
            {isBlocked && (
              <span title="Abhängigkeiten nicht erfüllt">
                <Lock size={12} className="text-gray-400" />
              </span>
            )}
          </div>

          {quest.description && (
            <p className="mt-1 text-xs text-gray-500 line-clamp-2">{quest.description}</p>
          )}

          {/* Badges */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant={status.variant}>{status.label}</Badge>
            <Badge variant={priority.variant}>{priority.label}</Badge>
            <Badge variant="purple">{quest.category}</Badge>
          </div>

          {/* Dependencies */}
          {dependencies.length > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
              <Link size={10} />
              <span>Braucht: {dependencies.map((d) => d.title).join(', ')}</span>
            </div>
          )}

          {/* Child quests */}
          {children.length > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-pink-500">
              <ChevronRight size={10} />
              <span>{children.length} Unterquest{children.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => onEdit(quest)} className="!p-1.5">
            <Pencil size={13} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(quest.id)} className="!p-1.5 hover:text-red-400">
            <Trash2 size={13} />
          </Button>
        </div>
      </div>
    </div>
  )
}
