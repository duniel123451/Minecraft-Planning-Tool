'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { getNodeTitle } from '@/types'
import type { ItemNode, ItemStatus, Dependency, AnyNode } from '@/types'
import { normalizeRichTextInput, sanitizeRichText } from '@/lib/richText'

interface ItemFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: Omit<ItemNode, 'id' | 'type' | 'createdAt' | 'updatedAt'>) => void
  initialData?: ItemNode | null
  allNodes: AnyNode[]
}

const emptyForm = {
  name: '', mod: '',
  status: 'needed' as ItemStatus,
  reason: '', purpose: '',
  dependencies: [] as Dependency[],
  notes: '',
}

export function ItemForm({ open, onClose, onSubmit, initialData, allNodes }: ItemFormProps) {
  const [form, setForm] = useState(() =>
    initialData
      ? {
          name:         initialData.name,
          mod:          initialData.mod,
          status:       initialData.status,
          reason:       normalizeRichTextInput(initialData.reason),
          purpose:      normalizeRichTextInput(initialData.purpose),
          dependencies: [...initialData.dependencies],
          notes:        normalizeRichTextInput(initialData.notes),
        }
      : emptyForm
  )

  const toggleDep = (targetId: string, defaultType: Dependency['type'] = 'requires') => {
    setForm(p => {
      const exists = p.dependencies.some(d => d.targetId === targetId)
      return {
        ...p,
        dependencies: exists
          ? p.dependencies.filter(d => d.targetId !== targetId)
          : [...p.dependencies, { targetId, type: defaultType }],
      }
    })
  }

  const changDepType = (targetId: string, type: Dependency['type']) =>
    setForm(p => ({
      ...p,
      dependencies: p.dependencies.map(d => d.targetId === targetId ? { ...d, type } : d),
    }))

  const changDepAmount = (targetId: string, amount: string) =>
    setForm(p => ({
      ...p,
      dependencies: p.dependencies.map(d =>
        d.targetId === targetId
          ? { ...d, amount: amount === '' ? undefined : Math.max(1, parseInt(amount) || 1) }
          : d
      ),
    }))

  const candidates = allNodes.filter(n => n.id !== initialData?.id)

  const handleSubmit = () => {
    if (!form.name.trim()) return
    onSubmit({
      ...form,
      reason:  sanitizeRichText(form.reason),
      purpose: sanitizeRichText(form.purpose),
      notes:   sanitizeRichText(form.notes),
    })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={initialData ? 'Item bearbeiten' : 'Neues Item'} maxWidth="max-w-xl">
      <div className="flex flex-col gap-4 pb-24">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Item Name *"
            placeholder="z.B. Vibranium Ingot"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          />
          <Input
            label="Mod"
            placeholder="z.B. ATM Alloys"
            value={form.mod}
            onChange={e => setForm(p => ({ ...p, mod: e.target.value }))}
          />
        </div>

        <Select
          label="Status"
          value={form.status}
          onChange={e => setForm(p => ({ ...p, status: e.target.value as ItemStatus }))}
        >
          <option value="needed">🔍 Gesucht</option>
          <option value="collecting">📥 Sammle</option>
          <option value="have">✅ Habe ich</option>
        </Select>

        <RichTextEditor
          label="Warum brauch ich das?"
          value={form.reason}
          onChange={value => setForm(p => ({ ...p, reason: value }))}
          placeholder="Motivation, Blocker, Kontext..."
        />

        <RichTextEditor
          label="Wofür ist es?"
          value={form.purpose}
          onChange={value => setForm(p => ({ ...p, purpose: value }))}
          placeholder="Welche Projekte profitieren davon?"
        />

        {/* Node Dependencies */}
        {candidates.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-gray-700">Abhängigkeiten & Crafting-Zutaten</p>
            <p className="text-xs text-gray-400">
              Bei <strong>requires</strong>-Abhängigkeiten kannst du eine Menge (×) angeben – das aktiviert die Ressourcen-Berechnung.
            </p>
            <div className="max-h-48 overflow-y-auto flex flex-col gap-1 rounded-xl border border-rose-100 p-2">
              {candidates.map(node => {
                const dep = form.dependencies.find(d => d.targetId === node.id)
                const selected = !!dep
                return (
                  <div key={node.id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${selected ? 'bg-purple-50' : 'hover:bg-rose-50'}`}>
                    <button
                      type="button"
                      onClick={() => toggleDep(node.id)}
                      className={`w-4 h-4 rounded flex items-center justify-center border flex-shrink-0 text-white text-xs
                        ${selected ? 'bg-purple-400 border-purple-400' : 'border-gray-300'}`}
                    >
                      {selected ? '✓' : ''}
                    </button>
                    <span>{node.type === 'quest' ? '📋' : '📦'}</span>
                    <span className="flex-1 truncate text-gray-700">{getNodeTitle(node)}</span>
                    {selected && (
                      <>
                        <select
                          value={dep!.type}
                          onChange={e => changDepType(node.id, e.target.value as Dependency['type'])}
                          className="rounded-lg border border-purple-200 bg-white px-1 py-0.5 text-xs outline-none"
                          onClick={e => e.stopPropagation()}
                        >
                          <option value="requires">requires</option>
                          <option value="related">related</option>
                        </select>
                        {dep!.type === 'requires' && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400">×</span>
                            <input
                              type="number"
                              min="1"
                              placeholder="–"
                              value={dep!.amount ?? ''}
                              onChange={e => changDepAmount(node.id, e.target.value)}
                              onClick={e => e.stopPropagation()}
                              className="w-12 rounded-lg border border-purple-200 bg-white px-1 py-0.5 text-xs text-center outline-none"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <RichTextEditor
          label="Notizen"
          value={form.notes}
          onChange={value => setForm(p => ({ ...p, notes: value }))}
          placeholder="Links, Crafting-Tipps, Testresultate..."
        />

      </div>
      <div className="sticky bottom-0 -mx-5 -mb-4 mt-4 flex items-center justify-end gap-2 border-t border-rose-50 dark:border-slate-800 px-5 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
        <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
        <Button onClick={handleSubmit} disabled={!form.name.trim()}>
          {initialData ? 'Speichern' : 'Erstellen'}
        </Button>
      </div>
    </Modal>
  )
}
