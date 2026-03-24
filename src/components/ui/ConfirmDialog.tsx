'use client'

import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title?: string
  description?: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title = 'Bist du sicher?',
  description = 'Diese Aktion kann nicht rückgängig gemacht werden.',
  confirmLabel = 'Löschen',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white border border-rose-100 shadow-xl p-5">
        <p className="text-base font-semibold text-gray-800">{title}</p>
        <p className="mt-1.5 text-sm text-gray-500">{description}</p>
        <div className="mt-4 flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Abbrechen
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
