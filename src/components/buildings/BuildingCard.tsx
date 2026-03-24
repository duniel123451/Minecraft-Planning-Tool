'use client'

import { Pencil, Trash2, MapPin, Palette } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Building, BuildingStatus } from '@/types'

const statusConfig: Record<BuildingStatus, { label: string; variant: 'gray' | 'amber' | 'green' }> = {
  planned: { label: 'Geplant', variant: 'gray' },
  'in-progress': { label: 'Im Bau', variant: 'amber' },
  done: { label: 'Fertig ✓', variant: 'green' },
}

interface BuildingCardProps {
  building: Building
  onEdit: (building: Building) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: BuildingStatus) => void
}

export function BuildingCard({ building, onEdit, onDelete, onStatusChange }: BuildingCardProps) {
  const status = statusConfig[building.status]

  const nextStatus: BuildingStatus =
    building.status === 'planned'
      ? 'in-progress'
      : building.status === 'in-progress'
      ? 'done'
      : 'planned'

  const completedReqs = Math.floor(
    (building.requirements.length * (building.status === 'done' ? 1 : building.status === 'in-progress' ? 0.5 : 0))
  )

  return (
    <div
      className={`
        bg-white rounded-2xl border p-4 shadow-sm
        ${building.status === 'done' ? 'border-emerald-100' : 'border-rose-100'}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏗️</span>
          <h3 className="font-semibold text-gray-800 text-sm">{building.name}</h3>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(building)} className="!p-1.5">
            <Pencil size={13} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(building.id)} className="!p-1.5 hover:text-red-400">
            <Trash2 size={13} />
          </Button>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-2 flex flex-col gap-1">
        {building.location && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin size={11} />
            <span>{building.location}</span>
          </div>
        )}
        {building.style && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Palette size={11} />
            <span>{building.style}</span>
          </div>
        )}
      </div>

      {/* Status badge + action */}
      <div className="mt-3 flex items-center gap-2">
        <Badge variant={status.variant}>{status.label}</Badge>
        <button
          onClick={() => onStatusChange(building.id, nextStatus)}
          className="text-xs text-pink-500 hover:text-pink-600 transition-colors"
        >
          → {statusConfig[nextStatus].label}
        </button>
      </div>

      {/* Requirements */}
      {building.requirements.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-500 mb-1.5">Anforderungen</p>
          <ul className="flex flex-col gap-1">
            {building.requirements.map((req, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-300 flex-shrink-0" />
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Notes */}
      {building.notes && (
        <p className="mt-3 text-xs text-gray-400 italic border-t border-rose-50 pt-2">
          {building.notes}
        </p>
      )}
    </div>
  )
}
