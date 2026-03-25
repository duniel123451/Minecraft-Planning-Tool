'use client'

import { useState, useEffect, useRef } from 'react'
import { ImagePlus, X, Plus, Search } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { NoteImage } from './NoteImage'
import { saveImage, deleteImages, isDataUrl } from '@/lib/imageStorage'
import { getNodeTitle, type LinkableNode } from '@/types'
import type { NoteLink, NoteNode } from '@/types/note'
import { getRichTextPreview, normalizeRichTextInput, sanitizeRichText } from '@/lib/richText'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB

interface NoteFormState {
  title:   string
  content: string
  images:  string[]
  tags:    string[]
  links:   NoteLink[]
}

const emptyForm: NoteFormState = {
  title:   '',
  content: '',
  images:  [],
  tags:    [],
  links:   [],
}

const nodeEmoji: Record<string, string> = {
  quest: '📋',
  item: '📦',
  building: '🏗️',
  note: '📝',
}

const nodeTypeLabel: Record<LinkableNode['type'], string> = {
  quest: 'Quest',
  item: 'Item',
  building: 'Gebäude',
  note: 'Notiz',
}

const getNodeSubtitle = (node: LinkableNode): string => {
  if (node.type === 'note') return getRichTextPreview(node.content, 80)
  if (node.type === 'quest') return getRichTextPreview(node.description, 80)
  if (node.type === 'item') return node.mod || getRichTextPreview(node.reason || node.purpose, 80)
  if (node.type === 'building') return node.location || node.style || ''
  return ''
}

interface NoteFormProps {
  open:         boolean
  onClose:      () => void
  onSubmit:     (data: Omit<NoteNode, 'id' | 'type' | 'createdAt' | 'updatedAt'>) => void
  initialData?: NoteNode | null
  allNodes:     LinkableNode[]
}

export function NoteForm({ open, onClose, onSubmit, initialData, allNodes }: NoteFormProps) {
  const [form, setForm]             = useState<NoteFormState>(() =>
    initialData
      ? {
          title:   initialData.title,
          content: normalizeRichTextInput(initialData.content),
          images:  [...initialData.images],
          tags:    [...initialData.tags],
          links:   [...(initialData.links ?? [])],
        }
      : emptyForm
  )
  const [newTag, setNewTag]         = useState('')
  const [nodeSearch, setNodeSearch] = useState('')
  const [dragOver, setDragOver]     = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const fileInputRef                = useRef<HTMLInputElement>(null)
  const newKeysRef                  = useRef<string[]>([])

  // Reset cleanup state when dialog opens (no setForm — parent uses key prop to remount)
  useEffect(() => {
    if (open) {
      newKeysRef.current = []
    }
  }, [open])

  const processFiles = (files: FileList | null) => {
    if (!files) return
    setImageError(null)
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return
      if (file.size > MAX_IMAGE_BYTES) {
        setImageError(`"${file.name}" ist zu groß (max. 5 MB)`)
        return
      }
      const key = crypto.randomUUID()
      saveImage(key, file)
        .then(() => {
          newKeysRef.current.push(key)
          setForm(p => ({ ...p, images: [...p.images, key] }))
        })
        .catch(() => setImageError(`"${file.name}" konnte nicht gespeichert werden`))
    })
  }

  const removeImage = (idx: number) => {
    const key = form.images[idx]
    if (!isDataUrl(key)) {
      deleteImages([key]).catch(() => {})
      newKeysRef.current = newKeysRef.current.filter(k => k !== key)
    }
    setForm(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }))
  }

  const addTag = () => {
    const t = newTag.trim().toLowerCase()
    if (!t || form.tags.includes(t)) { setNewTag(''); return }
    setForm(p => ({ ...p, tags: [...p.tags, t] }))
    setNewTag('')
  }

  const removeTag = (tag: string) => setForm(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }))

  const toggleNode = (nodeId: string) => {
    setForm(p => {
      const exists = p.links.some(link => link.targetId === nodeId)
      return {
        ...p,
        links: exists
          ? p.links.filter(link => link.targetId !== nodeId)
          : [...p.links, { targetId: nodeId, addedAt: new Date().toISOString() }],
      }
    })
  }

  const handleClose = () => {
    const orphans = newKeysRef.current.filter(k => form.images.includes(k))
    if (!initialData && orphans.length > 0) {
      deleteImages(orphans).catch(() => {})
    }
    newKeysRef.current = []
    setImageError(null)
    onClose()
  }

  const handleSubmit = () => {
    if (!form.title.trim()) return
    newKeysRef.current = []
    onSubmit({
      ...form,
      content: sanitizeRichText(form.content),
      links:   form.links,
    })
    setImageError(null)
    onClose()
  }

  const selectableNodes = allNodes.filter(n => n.id !== initialData?.id)
  const filteredNodes = selectableNodes.filter(n => {
    if (!nodeSearch) return true
    return getNodeTitle(n).toLowerCase().includes(nodeSearch.toLowerCase())
  })

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={initialData ? 'Notiz bearbeiten' : 'Neue Notiz'}
      maxWidth="max-w-2xl"
    >
      <div className="flex flex-col gap-5 pb-24">

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700 dark:text-slate-200">Titel *</label>
          <input
            className="w-full rounded-2xl border border-rose-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm md:text-base text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 dark:focus:ring-pink-900 transition-colors"
            placeholder="z.B. Ritual Chamber Setup"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        <RichTextEditor
          label="Inhalt / Notizen"
          value={form.content}
          onChange={value => setForm(p => ({ ...p, content: value }))}
          placeholder="Sammle Learnings, Crafting-Tipps, Links..."
          helperText="Formatierungen & Links bleiben jetzt erhalten."
        />

        {/* Tags */}
        <div className="flex flex-col gap-2.5">
          <label className="text-sm font-semibold text-gray-700 dark:text-slate-200">Tags</label>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-pink-50 dark:bg-pink-950 text-pink-500 dark:text-pink-300">
                  #{tag}
                  <button onClick={() => removeTag(tag)} className="text-pink-300 hover:text-pink-600 dark:text-pink-500">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-2xl border border-rose-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 outline-none focus:border-pink-400 transition-colors"
              placeholder="Tag hinzufügen..."
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <Button variant="secondary" onClick={addTag} className="flex-shrink-0 rounded-2xl px-4">
              <Plus size={13} />
            </Button>
          </div>
        </div>

        {/* Images */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-gray-700 dark:text-slate-200">Bilder & Screenshots</label>

          {form.images.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {form.images.map((ref, i) => (
                <div key={i} className="relative w-24 h-20 rounded-2xl overflow-hidden border border-rose-100 dark:border-slate-600 group">
                  <NoteImage imageRef={ref} alt={`Bild ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors"
                  >
                    <X size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {imageError && <p className="text-xs text-red-500">{imageError}</p>}

          <div
            className={`relative rounded-2xl border-2 border-dashed px-4 py-5 text-center transition-colors cursor-pointer ${dragOver ? 'border-pink-400 bg-pink-50 dark:bg-pink-950/30' : 'border-rose-200 dark:border-slate-600 hover:border-pink-300 hover:bg-rose-50 dark:hover:bg-slate-800'}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); processFiles(e.dataTransfer.files) }}
          >
            <ImagePlus size={24} className="mx-auto mb-1 text-rose-300" />
            <p className="text-xs text-gray-500 dark:text-slate-400">Klicken oder Bilder hierher ziehen (max. 5 MB)</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => processFiles(e.target.files)}
          />
        </div>

        {/* Linked Nodes */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-700 dark:text-slate-200 flex items-center gap-2">
              Verknüpfungen
              {form.links.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-pink-100 dark:bg-pink-900 text-pink-500">{form.links.length}</span>
              )}
            </label>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-2xl border border-rose-200 dark:border-slate-600 px-4 py-2.5">
            <Search size={14} className="text-gray-400 dark:text-slate-500" />
            <input
              className="flex-1 text-sm outline-none placeholder-gray-400 dark:placeholder-slate-500 bg-transparent text-gray-800 dark:text-slate-100"
              placeholder="Items, Builds, Quests & Notizen durchsuchen..."
              value={nodeSearch}
              onChange={e => setNodeSearch(e.target.value)}
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1 rounded-2xl border border-rose-100 dark:border-slate-700 p-1.5">
            {filteredNodes.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-slate-500 px-3 py-4 text-center">Keine Einträge gefunden</p>
            ) : (
              filteredNodes.map(node => {
                const selected = form.links.some(link => link.targetId === node.id)
                const subtitle = getNodeSubtitle(node)
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => toggleNode(node.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors border ${
                      selected
                        ? 'border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-900 dark:bg-pink-950/40'
                        : 'border-transparent hover:border-rose-100 dark:hover:border-slate-600 text-gray-700 dark:text-slate-200'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 text-xs ${selected ? 'bg-pink-500 border-pink-500 text-white' : 'border-gray-300 dark:border-slate-500 text-gray-400'}`}>
                      {selected && '✓'}
                    </span>
                    <span className="text-lg flex-shrink-0">{nodeEmoji[node.type] ?? '🔗'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">{getNodeTitle(node)}</p>
                      {subtitle && (
                        <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{subtitle}</p>
                      )}
                    </div>
                    <span className="text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 bg-rose-50 dark:bg-slate-800 text-rose-500 dark:text-pink-400">
                      {nodeTypeLabel[node.type]}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>

      </div>

      <div className="sticky bottom-0 -mx-5 -mb-4 mt-4 flex items-center justify-end gap-2 border-t border-rose-50 dark:border-slate-800 px-5 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
        <Button variant="secondary" onClick={handleClose}>Abbrechen</Button>
        <Button onClick={handleSubmit} disabled={!form.title.trim()}>Speichern</Button>
      </div>
    </Modal>
  )
}
