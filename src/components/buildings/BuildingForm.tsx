'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, X, ImagePlus } from 'lucide-react'
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
  const [form, setForm]       = useState(emptyForm)
  const [newReq, setNewReq]   = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialData) {
      setForm({
        name:         initialData.name,
        location:     initialData.location,
        style:        initialData.style,
        status:       initialData.status,
        requirements: [...initialData.requirements],
        inspoPics:    [...initialData.inspoPics],
        notes:        initialData.notes,
      })
    } else {
      setForm(emptyForm)
    }
    setNewReq('')
  }, [initialData, open])

  const addRequirement = () => {
    const trimmed = newReq.trim()
    if (!trimmed) return
    setForm(p => ({ ...p, requirements: [...p.requirements, trimmed] }))
    setNewReq('')
  }

  const removeRequirement = (i: number) =>
    setForm(p => ({ ...p, requirements: p.requirements.filter((_, idx) => idx !== i) }))

  const removeImage = (i: number) =>
    setForm(p => ({ ...p, inspoPics: p.inspoPics.filter((_, idx) => idx !== i) }))

  const processFiles = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = e => {
        const dataUrl = e.target?.result as string
        if (dataUrl) {
          setForm(p => ({ ...p, inspoPics: [...p.inspoPics, dataUrl] }))
        }
      }
      reader.readAsDataURL(file)
    })
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
      maxWidth="max-w-xl"
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Name *"
          placeholder="z.B. Main Base"
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Ort"
            placeholder="z.B. Spawn, Overworld"
            value={form.location}
            onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={e => setForm(p => ({ ...p, status: e.target.value as BuildingStatus }))}
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
          onChange={e => setForm(p => ({ ...p, style: e.target.value }))}
        />

        {/* Requirements */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-700">Anforderungen</p>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-colors"
              placeholder="Neue Anforderung..."
              value={newReq}
              onChange={e => setNewReq(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRequirement()}
            />
            <Button variant="secondary" size="sm" onClick={addRequirement}>
              <Plus size={14} />
            </Button>
          </div>
          {form.requirements.length > 0 && (
            <ul className="flex flex-col gap-1">
              {form.requirements.map((req, i) => (
                <li key={i} className="flex items-center justify-between gap-2 rounded-lg bg-rose-50 px-3 py-1.5 text-xs text-gray-700">
                  <span>{req}</span>
                  <button onClick={() => removeRequirement(i)} className="text-gray-400 hover:text-red-400 transition-colors">
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Screenshots / Inspo-Pics */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-700">Screenshots & Inspo-Bilder</p>

          {/* Drop zone */}
          <div
            className={`
              relative rounded-xl border-2 border-dashed p-4 text-center transition-colors cursor-pointer
              ${dragOver ? 'border-pink-400 bg-pink-50' : 'border-rose-200 hover:border-pink-300 hover:bg-rose-50'}
            `}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); processFiles(e.dataTransfer.files) }}
          >
            <ImagePlus size={20} className="mx-auto mb-1 text-rose-300" />
            <p className="text-xs text-gray-400">Klicken oder Bilder hierher ziehen</p>
            <p className="text-xs text-gray-300 mt-0.5">PNG, JPG, WebP</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => processFiles(e.target.files)}
            />
          </div>

          {/* Preview grid */}
          {form.inspoPics.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {form.inspoPics.map((src, i) => (
                <div key={i} className="relative group aspect-video rounded-xl overflow-hidden border border-rose-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Textarea
          label="Notizen"
          placeholder="Inspo, Ideen, Links..."
          value={form.notes}
          onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
          rows={3}
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
