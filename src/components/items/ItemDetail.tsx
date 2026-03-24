'use client'

import { X, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Item, ItemStatus } from '@/types'

const statusConfig: Record<ItemStatus, { label: string; variant: 'red' | 'amber' | 'green'; emoji: string }> = {
  needed: { label: 'Gesucht', variant: 'red', emoji: '🔍' },
  collecting: { label: 'Sammle', variant: 'amber', emoji: '📥' },
  have: { label: 'Habe ich ✓', variant: 'green', emoji: '✅' },
}

interface ItemDetailProps {
  item: Item | null
  linkedItems: Item[]
  onClose: () => void
  onEdit: (item: Item) => void
  onStatusChange: (id: string, status: ItemStatus) => void
  onLinkedItemClick: (item: Item) => void
}

export function ItemDetail({
  item,
  linkedItems,
  onClose,
  onEdit,
  onStatusChange,
  onLinkedItemClick,
}: ItemDetailProps) {
  if (!item) return null

  const status = statusConfig[item.status]
  const nextStatus: ItemStatus =
    item.status === 'needed' ? 'collecting' : item.status === 'collecting' ? 'have' : 'needed'

  return (
    <div className="h-full flex flex-col bg-white border-l border-rose-100">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-rose-50">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{status.emoji}</span>
            <h2 className="font-bold text-gray-800">{item.name}</h2>
          </div>
          <p className="text-sm text-pink-400 font-medium mt-0.5 ml-8">{item.mod}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="!p-1.5">
          <X size={16} />
        </Button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
        {/* Status */}
        <div className="flex items-center gap-3">
          <Badge variant={status.variant}>{status.label}</Badge>
          <button
            onClick={() => onStatusChange(item.id, nextStatus)}
            className="text-xs text-pink-500 hover:text-pink-600 transition-colors"
          >
            Ändern → {statusConfig[nextStatus].label}
          </button>
        </div>

        {/* Why / For what */}
        {(item.reason || item.purpose) && (
          <div className="flex flex-col gap-3">
            {item.reason && (
              <div className="rounded-xl bg-rose-50 p-3">
                <p className="text-xs font-semibold text-rose-500 mb-1">🤔 Warum brauch ich das?</p>
                <p className="text-sm text-gray-700">{item.reason}</p>
              </div>
            )}
            {item.purpose && (
              <div className="rounded-xl bg-pink-50 p-3">
                <p className="text-xs font-semibold text-pink-500 mb-1">🎯 Wofür ist es?</p>
                <p className="text-sm text-gray-700">{item.purpose}</p>
              </div>
            )}
          </div>
        )}

        {/* Ingredients / Requirements */}
        {item.ingredients.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              🧪 Zutaten / Anforderungen
            </p>
            <div className="flex flex-col gap-1.5">
              {item.ingredients.map((ing, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2"
                >
                  <span className="text-sm text-gray-700">{ing.name}</span>
                  <span className="text-xs font-medium text-pink-500">
                    {ing.amount}
                    {ing.unit ? ` ${ing.unit}` : 'x'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Linked items */}
        {linkedItems.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              🔗 Verknüpfte Items
            </p>
            <div className="flex flex-col gap-1.5">
              {linkedItems.map((linked) => {
                const linkedStatus = statusConfig[linked.status]
                return (
                  <button
                    key={linked.id}
                    onClick={() => onLinkedItemClick(linked)}
                    className="flex items-center justify-between rounded-xl bg-purple-50 px-3 py-2 hover:bg-purple-100 transition-colors text-left"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-700">{linked.name}</span>
                      <p className="text-xs text-purple-400">{linked.mod}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={linkedStatus.variant}>{linkedStatus.label}</Badge>
                      <ExternalLink size={12} className="text-gray-400" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        {item.notes && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              📝 Notizen
            </p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{item.notes}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-rose-50">
        <Button onClick={() => onEdit(item)} className="w-full justify-center">
          Bearbeiten
        </Button>
      </div>
    </div>
  )
}
