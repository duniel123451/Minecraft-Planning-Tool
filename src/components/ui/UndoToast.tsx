'use client'

import { useEffect } from 'react'
import { Undo2 } from 'lucide-react'

interface UndoToastProps {
  message: string
  onUndo: () => void
  onDismiss: () => void
  duration?: number // ms
}

export function UndoToast({ message, onUndo, onDismiss, duration = 5000 }: UndoToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration)
    return () => clearTimeout(t)
  }, [onDismiss, duration])

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl bg-gray-800 text-white px-4 py-3 shadow-lg text-sm">
      <span>{message}</span>
      <button
        onClick={() => { onUndo(); onDismiss() }}
        className="flex items-center gap-1 font-medium text-pink-300 hover:text-pink-200 transition-colors"
      >
        <Undo2 size={13} />
        Rückgängig
      </button>
    </div>
  )
}
