'use client'

import { useState, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { Item, ItemStatus, Ingredient } from '@/types'

interface ItemFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => void
  initialData?: Item | null
  allItems: Item[]
}

const emptyForm = {
  name: '',
  mod: '',
  status: 'needed' as ItemStatus,
  reason: '',
  purpose: '',
  ingredients: [] as Ingredient[],
  linkedItemIds: [] as string[],
  notes: '',
}

export function ItemForm({ open, onClose, onSubmit, initialData, allItems }: ItemFormProps) {
  const [form, setForm] = useState(emptyForm)
  const [newIngName, setNewIngName] = useState('')
  const [newIngAmount, setNewIngAmount] = useState('1')

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        mod: initialData.mod,
        status: initialData.status,
        reason: initialData.reason,
        purpose: initialData.purpose,
        ingredients: [...initialData.ingredients],
        linkedItemIds: [...initialData.linkedItemIds],
        notes: initialData.notes,
      })
    } else {
      setForm(emptyForm)
    }
    setNewIngName('')
    setNewIngAmount('1')
  }, [initialData, open])

  const addIngredient = () => {
    const name = newIngName.trim()
    if (!name) return
    const amount = parseFloat(newIngAmount) || 1
    setForm((p) => ({
      ...p,
      ingredients: [...p.ingredients, { name, amount }],
    }))
    setNewIngName('')
    setNewIngAmount('1')
  }

  const removeIngredient = (i: number) => {
    setForm((p) => ({
      ...p,
      ingredients: p.ingredients.filter((_, idx) => idx !== i),
    }))
  }

  const toggleLinked = (id: string) => {
    setForm((p) => ({
      ...p,
      linkedItemIds: p.linkedItemIds.includes(id)
        ? p.linkedItemIds.filter((l) => l !== id)
        : [...p.linkedItemIds, id],
    }))
  }

  const handleSubmit = () => {
    if (!form.name.trim()) return
    onSubmit(form)
    onClose()
  }

  const availableItems = allItems.filter((i) => i.id !== initialData?.id)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData ? 'Item bearbeiten' : 'Neues Item'}
      maxWidth="max-w-xl"
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Item Name *"
            placeholder="z.B. Vibranium Ingot"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <Input
            label="Mod"
            placeholder="z.B. ATM Alloys"
            value={form.mod}
            onChange={(e) => setForm((p) => ({ ...p, mod: e.target.value }))}
          />
        </div>

        <Select
          label="Status"
          value={form.status}
          onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as ItemStatus }))}
        >
          <option value="needed">🔍 Gesucht</option>
          <option value="collecting">📥 Sammle</option>
          <option value="have">✅ Habe ich</option>
        </Select>

        <Textarea
          label="Warum brauch ich das?"
          placeholder="z.B. Wird für den ATM Star benötigt"
          value={form.reason}
          onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
          rows={2}
        />

        <Textarea
          label="Wofür ist es?"
          placeholder="z.B. End-Game Crafting, ATM Star"
          value={form.purpose}
          onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))}
          rows={2}
        />

        {/* Ingredients */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-700">Zutaten / Anforderungen</p>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              placeholder="Zutat..."
              value={newIngName}
              onChange={(e) => setNewIngName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addIngredient()}
            />
            <input
              className="w-16 rounded-xl border border-rose-200 bg-white px-2 py-2 text-sm text-center outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              placeholder="1"
              type="number"
              min="1"
              value={newIngAmount}
              onChange={(e) => setNewIngAmount(e.target.value)}
            />
            <Button variant="secondary" size="sm" onClick={addIngredient}>
              <Plus size={14} />
            </Button>
          </div>
          {form.ingredients.length > 0 && (
            <ul className="flex flex-col gap-1">
              {form.ingredients.map((ing, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-1.5 text-xs"
                >
                  <span className="text-gray-700">{ing.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-pink-500">{ing.amount}x</span>
                    <button onClick={() => removeIngredient(i)} className="text-gray-400 hover:text-red-400">
                      <X size={12} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Linked items */}
        {availableItems.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-gray-700">Verknüpfte Items</p>
            <div className="max-h-32 overflow-y-auto flex flex-col gap-1 rounded-xl border border-rose-100 p-2">
              {availableItems.map((it) => {
                const selected = form.linkedItemIds.includes(it.id)
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => toggleLinked(it.id)}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-left transition-colors ${
                      selected ? 'bg-purple-50 text-purple-700' : 'hover:bg-rose-50 text-gray-600'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded flex items-center justify-center border ${selected ? 'bg-purple-400 border-purple-400 text-white' : 'border-gray-300'}`}>
                      {selected && '✓'}
                    </span>
                    <span>{it.name}</span>
                    <span className="text-gray-400 ml-auto">{it.mod}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <Textarea
          label="Notizen"
          placeholder="Weitere Infos, Fundorte, Tipps..."
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          rows={2}
        />

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button onClick={handleSubmit} disabled={!form.name.trim()}>
            {initialData ? 'Speichern' : 'Erstellen'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
