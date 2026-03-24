'use client'

import { useState, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { Building, BuildingStatus } from '@/types'

interface BuildingFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: Omit<Building, 'id' | 'createdAt' | 'updatedAt'>) => void
  initialData?: Building | null
}

const emptyForm = {
  name: '',
  location: '',
  style: '',
  status: 'planned' as BuildingStatus,
  requirements: [] as string[],
  inspoPics: [] as string[],
  notes: '',
}

export function BuildingForm({ open, onClose, onSubmit, initialData }: BuildingFormProps) {
  const [form, setForm] = useState(emptyForm)
  const [newReq, setNewReq] = useState('')

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        location: initialData.location,
        style: initialData.style,
        status: initialData.status,
        requirements: [...initialData.requirements],
        inspoPics: [...initialData.inspoPics],
        notes: initialData.notes,
      })
    } else {
      setForm(emptyForm)
    }
    setNewReq('')
  }, [initialData, open])

  const addRequirement = () => {
    const trimmed = newReq.trim()
    if (!trimmed) return
    setForm((p) => ({ ...p, requirements: [...p.requirements, trimmed] }))
    setNewReq('')
  }

  const removeRequirement = (i: number) => {
    setForm((p) => ({
      ...p,
      requirements: p.requirements.filter((_, idx) => idx !== i),
    }))
  }

  const handleSubmit = () => {
    if (!form.name.trim()) return
    onSubmit(form)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData ? 'Gebäude bearbeiten' : 'Neues Gebäude'}
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Name *"
          placeholder="z.B. Main Base"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Ort"
            placeholder="z.B. Spawn, Overworld"
            value={form.location}
            onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
          />

          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as BuildingStatus }))}
          >
            <option value="planned">Geplant</option>
            <option value="in-progress">Im Bau</option>
            <option value="done">Fertig</option>
          </Select>
        </div>

        <Input
          label="Stil"
          placeholder="z.B. Cozy Cottage, Modern Industrial"
          value={form.style}
          onChange={(e) => setForm((p) => ({ ...p, style: e.target.value }))}
        />

        {/* Requirements */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-700">Anforderungen</p>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-colors"
              placeholder="Neue Anforderung..."
              value={newReq}
              onChange={(e) => setNewReq(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addRequirement()}
            />
            <Button variant="secondary" size="sm" onClick={addRequirement}>
              <Plus size={14} />
            </Button>
          </div>
          {form.requirements.length > 0 && (
            <ul className="flex flex-col gap-1">
              {form.requirements.map((req, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-lg bg-rose-50 px-3 py-1.5 text-xs text-gray-700"
                >
                  <span>{req}</span>
                  <button
                    onClick={() => removeRequirement(i)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Textarea
          label="Notizen"
          placeholder="Inspo, Ideen, Links..."
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          rows={3}
        />

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={!form.name.trim()}>
            {initialData ? 'Speichern' : 'Erstellen'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
