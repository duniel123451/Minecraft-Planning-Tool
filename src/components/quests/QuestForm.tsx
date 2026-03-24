'use client'

import { useState, useEffect } from 'react'
import { Plus, Minus } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { Quest, QuestStatus, QuestPriority, QuestCategory } from '@/types'

interface QuestFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: Omit<Quest, 'id' | 'createdAt' | 'updatedAt'>) => void
  initialData?: Quest | null
  allQuests: Quest[]
}

const emptyForm = {
  title: '',
  description: '',
  status: 'open' as QuestStatus,
  priority: 'medium' as QuestPriority,
  category: 'other' as QuestCategory,
  parentId: null as string | null,
  dependsOn: [] as string[],
  notes: '',
}

export function QuestForm({ open, onClose, onSubmit, initialData, allQuests }: QuestFormProps) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title,
        description: initialData.description,
        status: initialData.status,
        priority: initialData.priority,
        category: initialData.category,
        parentId: initialData.parentId,
        dependsOn: initialData.dependsOn,
        notes: initialData.notes,
      })
    } else {
      setForm(emptyForm)
    }
  }, [initialData, open])

  const toggleDependency = (id: string) => {
    setForm((prev) => ({
      ...prev,
      dependsOn: prev.dependsOn.includes(id)
        ? prev.dependsOn.filter((d) => d !== id)
        : [...prev.dependsOn, id],
    }))
  }

  const handleSubmit = () => {
    if (!form.title.trim()) return
    onSubmit(form)
    onClose()
  }

  // Don't show the quest itself as a possible dependency
  const availableQuests = allQuests.filter((q) => q.id !== initialData?.id)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData ? 'Quest bearbeiten' : 'Neue Quest'}
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Titel *"
          placeholder="z.B. ATM Star craften"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
        />

        <Textarea
          label="Beschreibung"
          placeholder="Was muss gemacht werden?"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          rows={3}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as QuestStatus }))}
          >
            <option value="open">Offen</option>
            <option value="in-progress">In Arbeit</option>
            <option value="done">Erledigt</option>
          </Select>

          <Select
            label="Priorität"
            value={form.priority}
            onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as QuestPriority }))}
          >
            <option value="low">Niedrig</option>
            <option value="medium">Mittel</option>
            <option value="high">Hoch</option>
          </Select>
        </div>

        <Select
          label="Kategorie"
          value={form.category}
          onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as QuestCategory }))}
        >
          <option value="progression">⭐ Progression</option>
          <option value="building">🏗️ Building</option>
          <option value="farming">🌾 Farming</option>
          <option value="exploration">🗺️ Exploration</option>
          <option value="crafting">🔨 Crafting</option>
          <option value="automation">⚙️ Automation</option>
          <option value="other">📌 Other</option>
        </Select>

        <Select
          label="Übergeordnete Quest (optional)"
          value={form.parentId ?? ''}
          onChange={(e) =>
            setForm((p) => ({ ...p, parentId: e.target.value || null }))
          }
        >
          <option value="">— Keine —</option>
          {availableQuests.map((q) => (
            <option key={q.id} value={q.id}>
              {q.title}
            </option>
          ))}
        </Select>

        {/* Dependencies */}
        {availableQuests.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-gray-700">
              Abhängigkeiten (muss zuerst erledigt sein)
            </p>
            <div className="max-h-40 overflow-y-auto flex flex-col gap-1.5 rounded-xl border border-rose-100 p-2">
              {availableQuests.map((q) => {
                const selected = form.dependsOn.includes(q.id)
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => toggleDependency(q.id)}
                    className={`
                      flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-left
                      transition-colors duration-100
                      ${selected ? 'bg-pink-50 text-pink-700' : 'hover:bg-rose-50 text-gray-600'}
                    `}
                  >
                    <span className={`w-4 h-4 rounded flex items-center justify-center border ${selected ? 'bg-pink-400 border-pink-400 text-white' : 'border-gray-300'}`}>
                      {selected && '✓'}
                    </span>
                    {q.title}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <Textarea
          label="Notizen"
          placeholder="Weitere Infos..."
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          rows={2}
        />

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={!form.title.trim()}>
            {initialData ? 'Speichern' : 'Erstellen'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
