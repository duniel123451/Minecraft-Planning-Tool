'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import type { QuestNode, QuestStatus, QuestPriority, QuestCategory, Dependency, AnyNode } from '@/types'
import { getNodeTitle } from '@/types'
import { normalizeRichTextInput, sanitizeRichText } from '@/lib/richText'

interface QuestFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: Omit<QuestNode, 'id' | 'type' | 'createdAt' | 'updatedAt'>) => void
  initialData?: QuestNode | null
  allQuests: QuestNode[]
  allItems:  AnyNode[]   // for cross-type dependencies
}

const emptyForm = {
  title: '',
  description: '',
  status: 'open' as QuestStatus,
  priority: 'medium' as QuestPriority,
  category: 'other' as QuestCategory,
  parentId: null as string | null,
  dependencies: [] as Dependency[],
  notes: '',
}

export function QuestForm({ open, onClose, onSubmit, initialData, allQuests, allItems }: QuestFormProps) {
  const [form, setForm] = useState(() =>
    initialData
      ? {
          title:        initialData.title,
          description:  normalizeRichTextInput(initialData.description),
          status:       initialData.status,
          priority:     initialData.priority,
          category:     initialData.category,
          parentId:     initialData.parentId,
          dependencies: [...initialData.dependencies],
          notes:        normalizeRichTextInput(initialData.notes),
        }
      : emptyForm
  )

  const toggleDep = (targetId: string) => {
    setForm(p => {
      const exists = p.dependencies.some(d => d.targetId === targetId)
      return {
        ...p,
        dependencies: exists
          ? p.dependencies.filter(d => d.targetId !== targetId)
          : [...p.dependencies, { targetId, type: 'requires' }],
      }
    })
  }

  const handleSubmit = () => {
    if (!form.title.trim()) return
    onSubmit({
      ...form,
      description: sanitizeRichText(form.description),
      notes:       sanitizeRichText(form.notes),
    })
    onClose()
  }

  // All possible dep nodes (quests + items, excluding self)
  const depCandidates: AnyNode[] = [
    ...allQuests.filter(q => q.id !== initialData?.id),
    ...allItems.filter(i => i.type === 'item'),
  ]

  return (
    <Modal open={open} onClose={onClose} title={initialData ? 'Quest bearbeiten' : 'Neue Quest'}>
      <div className="flex flex-col gap-4 pb-24">
        <Input
          label="Titel *"
          placeholder="z.B. ATM Star craften"
          value={form.title}
          onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
        />

        <RichTextEditor
          label="Beschreibung"
          placeholder="Was muss gemacht werden?"
          value={form.description}
          onChange={value => setForm(p => ({ ...p, description: value }))}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Status"
            value={form.status}
            onChange={e => setForm(p => ({ ...p, status: e.target.value as QuestStatus }))}
          >
            <option value="open">Offen</option>
            <option value="in-progress">In Arbeit</option>
            <option value="done">Erledigt</option>
          </Select>
          <Select
            label="Priorität"
            value={form.priority}
            onChange={e => setForm(p => ({ ...p, priority: e.target.value as QuestPriority }))}
          >
            <option value="low">Niedrig</option>
            <option value="medium">Mittel</option>
            <option value="high">Hoch</option>
          </Select>
        </div>

        <Select
          label="Kategorie"
          value={form.category}
          onChange={e => setForm(p => ({ ...p, category: e.target.value as QuestCategory }))}
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
          onChange={e => setForm(p => ({ ...p, parentId: e.target.value || null }))}
        >
          <option value="">— Keine —</option>
          {allQuests
            .filter(q => q.id !== initialData?.id)
            .map(q => (
              <option key={q.id} value={q.id}>{q.title}</option>
            ))}
        </Select>

        {/* Dependencies */}
        {depCandidates.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-gray-700">Abhängigkeiten (requires)</p>
            <div className="max-h-40 overflow-y-auto flex flex-col gap-1 rounded-xl border border-rose-100 p-2">
              {depCandidates.map(node => {
                const selected = form.dependencies.some(d => d.targetId === node.id)
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => toggleDep(node.id)}
                    className={`
                      flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-left transition-colors
                      ${selected ? 'bg-pink-50 text-pink-700' : 'hover:bg-rose-50 text-gray-600'}
                    `}
                  >
                    <span className={`w-4 h-4 rounded flex items-center justify-center border text-white text-xs
                      ${selected ? 'bg-pink-400 border-pink-400' : 'border-gray-300'}`}
                    >
                      {selected ? '✓' : ''}
                    </span>
                    <span>{node.type === 'quest' ? '📋' : '📦'}</span>
                    <span className="truncate">{getNodeTitle(node)}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <RichTextEditor
          label="Notizen"
          placeholder="Weitere Infos..."
          value={form.notes}
          onChange={value => setForm(p => ({ ...p, notes: value }))}
        />

      </div>
      <div className="sticky bottom-0 -mx-5 -mb-4 mt-4 flex items-center justify-end gap-2 border-t border-rose-50 dark:border-slate-800 px-5 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
        <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
        <Button onClick={handleSubmit} disabled={!form.title.trim()}>
          {initialData ? 'Speichern' : 'Erstellen'}
        </Button>
      </div>
    </Modal>
  )
}
