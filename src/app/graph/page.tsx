'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { type Connection, type Edge } from '@xyflow/react'
import { Filter, Target, Plus, X, Trash2 } from 'lucide-react'

import { useQuestStore }    from '@/store/useQuestStore'
import { useItemStore }     from '@/store/useItemStore'
import { useGoalStore }     from '@/store/useGoalStore'
import { useBuildingStore } from '@/store/useBuildingStore'
import { useNoteStore }     from '@/store/useNoteStore'
import { GraphView }                   from '@/components/graph/GraphView'
import { GraphCreateQuestModal }       from '@/components/graph/GraphCreateQuestModal'
import { GraphCreateBuildingModal }    from '@/components/graph/GraphCreateBuildingModal'
import { NoteForm }                    from '@/components/notes/NoteForm'
import { convertNodesToGraph }         from '@/lib/graph/convert'
import { applyAutoLayout }             from '@/lib/graph/layout'
import { validateNewRequiresEdge }     from '@/lib/graph/validation'
import { parseEdgeId, addRequiresDep, removeRequiresDep } from '@/lib/graph/editing'
import { getImageBlob, isDataUrl } from '@/lib/imageStorage'
import {
  getNodeTitle, isNodeDone,
  type AnyNode, type QuestStatus, type ItemStatus, type BuildingStatus,
} from '@/types'
import type { NoteNode } from '@/types/note'
import { getNodeState, getBlockedDependencies, getDependencyChain } from '@/lib/progression'
import { getRequiredNodesForGoal, getNextStepsForGoal, getBlockingNodesForGoal } from '@/lib/planning'
import { Badge }         from '@/components/ui/Badge'
import { Button }        from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { UndoToast }     from '@/components/ui/UndoToast'
import { useDeleteNode } from '@/hooks/useDeleteNode'

type StatusFilter = 'all' | 'not-completed' | 'done' | 'available' | 'locked'

// Suppress unused import warnings for types only used in JSX narrowing
type _QuestStatus    = QuestStatus
type _ItemStatus     = ItemStatus
type _BuildingStatus = BuildingStatus

export default function GraphPage() {
  const quests             = useQuestStore(s => s.quests)
  const updateQuest        = useQuestStore(s => s.updateQuest)
  const items              = useItemStore(s => s.items)
  const updateItem         = useItemStore(s => s.updateItem)
  const buildings          = useBuildingStore(s => s.buildings)
  const updateBuilding     = useBuildingStore(s => s.updateBuilding)
  const undoDeleteBuilding = useBuildingStore(s => s.undoDelete)

  const notes         = useNoteStore(s => s.notes)
  const addNote       = useNoteStore(s => s.addNote)
  const updateNote    = useNoteStore(s => s.updateNote)
  const undoDeleteNote = useNoteStore(s => s.undoDelete)

  const { deleteNodeAndCleanup, undoDeleteQuest, undoDeleteItem } = useDeleteNode()

  const [showQuests,    setShowQuests]    = useState(true)
  const [showItems,     setShowItems]     = useState(true)
  const [showBuildings, setShowBuildings] = useState(true)
  const [showNotes,     setShowNotes]     = useState(true)
  const [statusFilter,  setStatusFilter]  = useState<StatusFilter>('all')
  const [modFilter,     setModFilter]     = useState('all')
  const [noteFilter,    setNoteFilter]    = useState<'all' | 'with-images' | 'no-images'>('all')
  const [noteTagFilter, setNoteTagFilter] = useState<string | null>(null)

  const [selectedNode,  setSelectedNode]  = useState<AnyNode | NoteNode | null>(null)
  const [selectedEdge,  setSelectedEdge]  = useState<Edge | null>(null)
  const [showFilters,   setShowFilters]   = useState(false)
  const [showCreateQuestModal,    setShowCreateQuestModal]    = useState(false)
  const [showCreateBuildingModal, setShowCreateBuildingModal] = useState(false)
  const [showCreateNoteModal,     setShowCreateNoteModal]     = useState(false)
  const [editNoteTarget,          setEditNoteTarget]          = useState<NoteNode | null>(null)
  const [edgeError,     setEdgeError]     = useState<string | null>(null)

  const [deleteConfirmNode, setDeleteConfirmNode] = useState<AnyNode | NoteNode | null>(null)
  const [showUndo,          setShowUndo]          = useState(false)
  const [lastDeletedTitle,  setLastDeletedTitle]  = useState('')
  const [lastDeletedType,   setLastDeletedType]   = useState<'quest' | 'item' | 'building' | 'note'>('quest')

  const [noteImageUrls, setNoteImageUrls] = useState<(string | null)[]>([])

  const { goals, toggleGoal, isGoal } = useGoalStore()

  const allNodes: AnyNode[] = useMemo(
    () => [...quests, ...items, ...buildings],
    [quests, items, buildings],
  )

  // Type narrowing helpers
  const selectedNote    = selectedNode?.type === 'note'    ? selectedNode as NoteNode : null
  const selectedAnyNode = selectedNode?.type !== 'note' && selectedNode ? selectedNode as AnyNode : null

  // Compute goal highlight sets for all active goals
  const highlights = useMemo(() => {
    const goalIds     = new Set<string>()
    const nextStepIds = new Set<string>()
    const blockerIds  = new Set<string>()
    const pathIds     = new Set<string>()

    goals.forEach(g => {
      goalIds.add(g.targetNodeId)
      getRequiredNodesForGoal(g.targetNodeId, allNodes).forEach(n => pathIds.add(n.id))
      getNextStepsForGoal(g.targetNodeId, allNodes).forEach(n => nextStepIds.add(n.id))
      getBlockingNodesForGoal(g.targetNodeId, allNodes).forEach(n => blockerIds.add(n.id))
    })

    return { goalIds, nextStepIds, blockerIds, pathIds }
  }, [goals, allNodes])

  const allMods = useMemo(() => {
    const mods = Array.from(new Set(items.map(i => i.mod).filter(Boolean))).sort()
    return ['all', ...mods]
  }, [items])

  const allNoteTags = useMemo(() => {
    const tags = new Set<string>()
    notes.forEach(n => n.tags.forEach(t => tags.add(t)))
    return Array.from(tags).sort()
  }, [notes])

  const visibleNodes = useMemo(() => {
    return allNodes.filter(node => {
      if (!showQuests    && node.type === 'quest')    return false
      if (!showItems     && node.type === 'item')     return false
      if (!showBuildings && node.type === 'building') return false
      if (modFilter !== 'all' && node.type === 'item' && node.mod !== modFilter) return false

      if (statusFilter !== 'all') {
        const state = getNodeState(node.id, allNodes)
        if (statusFilter === 'not-completed') {
          if (state === 'done') return false
        } else {
          if (state !== statusFilter) return false
        }
      }

      return true
    })
  }, [allNodes, showQuests, showItems, showBuildings, statusFilter, modFilter])

  const visibleNotes = useMemo(() => {
    if (!showNotes) return []
    return notes.filter(note => {
      if (noteFilter === 'with-images'  && note.images.length === 0) return false
      if (noteFilter === 'no-images'    && note.images.length > 0)   return false
      if (noteTagFilter && !note.tags.includes(noteTagFilter))        return false
      return true
    })
  }, [notes, showNotes, noteFilter, noteTagFilter])

  const { nodes: rawNodes, edges } = useMemo(
    () => convertNodesToGraph(allNodes, visibleNodes, highlights, visibleNotes),
    [allNodes, visibleNodes, highlights, visibleNotes],
  )

  const nodes = useMemo(
    () => applyAutoLayout(rawNodes, edges),
    [rawNodes, edges],
  )

  // Load images for selected note
  useEffect(() => {
    if (!selectedNote) { setNoteImageUrls([]); return }
    let cancelled = false
    const created: string[] = []

    Promise.all(selectedNote.images.map(async key => {
      if (isDataUrl(key)) return key
      const blob = await getImageBlob(key).catch(() => null)
      if (!blob) return null
      const u = URL.createObjectURL(blob)
      created.push(u)
      return u
    })).then(urls => { if (!cancelled) setNoteImageUrls(urls) })

    return () => {
      cancelled = true
      created.forEach(u => URL.revokeObjectURL(u))
    }
  }, [selectedNote?.id])

  const handleNodeClick = useCallback((node: AnyNode | NoteNode) => {
    setSelectedEdge(null)
    setSelectedNode(prev => (prev?.id === node.id ? null : node))
  }, [])

  const handleEdgeClick = useCallback((_e: React.MouseEvent, edge: Edge) => {
    setSelectedNode(null)
    setSelectedEdge(prev => (prev?.id === edge.id ? null : edge))
  }, [])

  // ─── Edge editing ──────────────────────────────────────────────────────────

  const showEdgeError = useCallback((msg: string) => {
    setEdgeError(msg)
    const t = setTimeout(() => setEdgeError(null), 3500)
    return () => clearTimeout(t)
  }, [])

  const handleConnect = useCallback((connection: Connection) => {
    const { source, target } = connection
    if (!source || !target) return

    // In our model: source = required node, target = dependent node
    const validation = validateNewRequiresEdge(target, source, allNodes)
    if (!validation.ok) {
      showEdgeError(validation.error ?? 'Ungültige Verbindung.')
      return
    }
    addRequiresDep(target, source, allNodes)
  }, [allNodes, showEdgeError])

  const handleEdgesDelete = useCallback((deletedEdges: Edge[]) => {
    deletedEdges.forEach(edge => {
      const parsed = parseEdgeId(edge.id)
      if (!parsed || parsed.type !== 'requires') return
      // source = required node, target = dependent node
      removeRequiresDep(parsed.target, parsed.source, allNodes)
    })
    setSelectedEdge(null)
  }, [allNodes])

  const handleDeleteSelectedEdge = useCallback(() => {
    if (!selectedEdge) return
    handleEdgesDelete([selectedEdge])
  }, [selectedEdge, handleEdgesDelete])

  const handleReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
    const parsed = parseEdgeId(oldEdge.id)
    if (!parsed || parsed.type !== 'requires') return

    const { source: newRequired, target: newDependent } = newConnection
    if (!newRequired || !newDependent) return

    // Temporarily remove the old dep so cycle check doesn't see it
    removeRequiresDep(parsed.target, parsed.source, allNodes)

    // Re-read allNodes after removal to get fresh state for validation
    const freshNodes: AnyNode[] = [
      ...useQuestStore.getState().quests,
      ...useItemStore.getState().items,
      ...useBuildingStore.getState().buildings,
    ]

    const validation = validateNewRequiresEdge(newDependent, newRequired, freshNodes)
    if (!validation.ok) {
      // Restore the old dep
      addRequiresDep(parsed.target, parsed.source, allNodes)
      showEdgeError(validation.error ?? 'Ungültige Verbindung.')
      return
    }

    addRequiresDep(newDependent, newRequired, freshNodes)
  }, [allNodes, showEdgeError])

  // ─── Node delete ──────────────────────────────────────────────────────────

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteConfirmNode) return

    if (deleteConfirmNode.type === 'note') {
      const noteNode = deleteConfirmNode as NoteNode
      setLastDeletedTitle(noteNode.title)
      setLastDeletedType('note')
      useNoteStore.getState().deleteNote(noteNode.id)
    } else {
      const anyNode = deleteConfirmNode as AnyNode
      setLastDeletedTitle(getNodeTitle(anyNode))
      setLastDeletedType(anyNode.type)
      deleteNodeAndCleanup(anyNode.id, anyNode.type)
    }

    setDeleteConfirmNode(null)
    setSelectedNode(null)
    setShowUndo(true)
  }, [deleteConfirmNode, deleteNodeAndCleanup])

  const handleUndoDelete = useCallback(() => {
    if (lastDeletedType === 'quest')      undoDeleteQuest()
    else if (lastDeletedType === 'item')  undoDeleteItem()
    else if (lastDeletedType === 'note')  undoDeleteNote()
    else                                  undoDeleteBuilding()
    setShowUndo(false)
  }, [lastDeletedType, undoDeleteQuest, undoDeleteItem, undoDeleteNote, undoDeleteBuilding])

  // ─── Note submit ──────────────────────────────────────────────────────────

  const handleNoteSubmit = useCallback((data: Omit<NoteNode, 'id' | 'type' | 'createdAt' | 'updatedAt'>) => {
    if (editNoteTarget) {
      updateNote(editNoteTarget.id, data)
    } else {
      addNote(data)
    }
  }, [editNoteTarget, updateNote, addNote])

  // ─── Detail panel data ─────────────────────────────────────────────────────

  // Live node data (reactive — reflects store updates without re-click)
  const liveQuest    = selectedAnyNode?.type === 'quest'
    ? quests.find(q => q.id === selectedAnyNode.id) ?? null
    : null
  const liveItem     = selectedAnyNode?.type === 'item'
    ? items.find(i => i.id === selectedAnyNode.id) ?? null
    : null
  const liveBuilding = selectedAnyNode?.type === 'building'
    ? buildings.find(b => b.id === selectedAnyNode.id) ?? null
    : null

  const nodeState    = selectedAnyNode ? getNodeState(selectedAnyNode.id, allNodes) : null
  const blockedBy    = selectedAnyNode ? getBlockedDependencies(selectedAnyNode.id, allNodes) : []
  const chain        = selectedAnyNode ? getDependencyChain(selectedAnyNode.id, allNodes) : []
  const unlocksNodes = selectedAnyNode
    ? allNodes.filter(n => n.dependencies.some(d => d.targetId === selectedAnyNode.id && d.type === 'requires'))
    : []

  // Buildings that depend on the selected item/quest
  const usedInBuildings = selectedAnyNode && selectedAnyNode.type !== 'building'
    ? buildings.filter(b => b.dependencies.some(d => d.targetId === selectedAnyNode.id))
    : []

  const stateLabel:   Record<string, string>               = { done: 'Erledigt ✓', available: 'Verfügbar', locked: '🔒 Gesperrt' }
  const stateVariant: Record<string, 'green' | 'amber' | 'gray'> = { done: 'green', available: 'amber', locked: 'gray' }

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-rose-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base">🗺️</span>
          <h1 className="text-sm font-bold text-gray-800">Dependency Graph</h1>
          <span className="text-xs text-gray-400">
            {visibleNodes.length + visibleNotes.length}/{allNodes.length + notes.length} Nodes
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Delete selected edge */}
          {selectedEdge && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleDeleteSelectedEdge}
              className="gap-1 text-red-500 border-red-200 hover:bg-red-50"
            >
              <Trash2 size={12} />
              Verbindung löschen
            </Button>
          )}

          {/* Create quest */}
          <Button
            size="sm"
            onClick={() => setShowCreateQuestModal(true)}
            className="gap-1"
          >
            <Plus size={12} />
            Neue Quest
          </Button>

          {/* Create building */}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowCreateBuildingModal(true)}
            className="gap-1 border-teal-200 text-teal-700 hover:bg-teal-50"
          >
            <Plus size={12} />
            Neues Gebäude
          </Button>

          {/* Create note */}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => { setEditNoteTarget(null); setShowCreateNoteModal(true) }}
            className="gap-1 border-amber-200 text-amber-700 hover:bg-amber-50"
          >
            <Plus size={12} />
            Neue Notiz
          </Button>

          {/* Quick toggles */}
          <button
            onClick={() => setShowQuests(v => !v)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              showQuests ? 'bg-pink-400 text-white border-pink-400' : 'bg-white text-gray-400 border-gray-200'
            }`}
          >
            📋 Quests
          </button>
          <button
            onClick={() => setShowItems(v => !v)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              showItems ? 'bg-purple-400 text-white border-purple-400' : 'bg-white text-gray-400 border-gray-200'
            }`}
          >
            📦 Items
          </button>
          <button
            onClick={() => setShowBuildings(v => !v)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              showBuildings ? 'bg-teal-400 text-white border-teal-400' : 'bg-white text-gray-400 border-gray-200'
            }`}
          >
            🏗️ Gebäude
          </button>
          <button
            onClick={() => setShowNotes(v => !v)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              showNotes ? 'bg-amber-400 text-white border-amber-400' : 'bg-white text-gray-400 border-gray-200'
            }`}
          >
            📝 Notizen
          </button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFilters(v => !v)}
            className="gap-1"
          >
            <Filter size={12} />
            Filter
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-rose-50 border-b border-rose-100 flex-shrink-0">
          <span className="text-xs font-medium text-gray-500">Status:</span>
          {(
            [
              { value: 'all',           label: 'Alle' },
              { value: 'not-completed', label: '🔄 Nicht fertig' },
              { value: 'done',          label: '✅ Erledigt' },
              { value: 'available',     label: '🟡 Verfügbar' },
              { value: 'locked',        label: '🔒 Gesperrt' },
            ] as { value: StatusFilter; label: string }[]
          ).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === value
                  ? 'bg-pink-400 text-white'
                  : 'bg-white text-gray-500 border border-rose-100 hover:bg-rose-50'
              }`}
            >
              {label}
            </button>
          ))}

          {allMods.length > 2 && (
            <>
              <span className="text-xs font-medium text-gray-500 ml-2">Mod:</span>
              <select
                value={modFilter}
                onChange={e => setModFilter(e.target.value)}
                className="rounded-lg border border-rose-200 bg-white px-2 py-1 text-xs outline-none focus:border-pink-400"
              >
                {allMods.map(m => (
                  <option key={m} value={m}>{m === 'all' ? 'Alle Mods' : m}</option>
                ))}
              </select>
            </>
          )}

          {showNotes && (
            <>
              <span className="text-xs font-medium text-gray-500 ml-2">Notizen:</span>
              {(['all', 'with-images', 'no-images'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setNoteFilter(f)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                    noteFilter === f ? 'bg-amber-400 text-white' : 'bg-white text-gray-500 border border-rose-100 hover:bg-amber-50'
                  }`}
                >
                  {f === 'all' ? 'Alle' : f === 'with-images' ? '🖼️ Mit Bild' : '📝 Nur Text'}
                </button>
              ))}
              {allNoteTags.length > 0 && (
                <select
                  value={noteTagFilter ?? ''}
                  onChange={e => setNoteTagFilter(e.target.value || null)}
                  className="rounded-lg border border-rose-200 bg-white px-2 py-1 text-xs outline-none focus:border-amber-400"
                >
                  <option value="">Alle Tags</option>
                  {allNoteTags.map(t => <option key={t} value={t}>#{t}</option>)}
                </select>
              )}
            </>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-1.5 bg-white border-b border-rose-50 text-xs text-gray-400 flex-shrink-0">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-orange-400 inline-block" /> requires</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-purple-400 inline-block" style={{ borderTop: '1px dashed #a78bfa' }} /> related</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block" style={{ borderTop: '1.5px dashed #f59e0b' }} /> notiz</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> verfügbar</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-300 inline-block" /> gesperrt</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> erledigt</span>
        {goals.length > 0 && (
          <>
            <span className="flex items-center gap-1 text-pink-500">🎯 Ziel</span>
            <span className="flex items-center gap-1 text-blue-500">▶ nächster Schritt</span>
            <span className="flex items-center gap-1 text-red-400">🔒 Blocker</span>
          </>
        )}
        <span className="ml-auto flex items-center gap-2 text-gray-300 italic">
          Verbindung ziehen · Entf zum Löschen · Kante anklicken zum Auswählen
        </span>
      </div>

      {/* Edge validation error */}
      {edgeError && (
        <div className="flex items-center justify-between gap-2 px-4 py-2 bg-red-50 border-b border-red-100 text-xs text-red-600 flex-shrink-0">
          <span>⚠️ {edgeError}</span>
          <button onClick={() => setEdgeError(null)} className="hover:text-red-800">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Main canvas + detail */}
      <div className="flex flex-1 min-h-0">
        {/* Graph canvas */}
        <div className="flex-1 min-w-0">
          {visibleNodes.length === 0 && visibleNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 text-sm">
              <span>Keine Nodes sichtbar – Filter anpassen</span>
              <Button onClick={() => setShowCreateQuestModal(true)} className="gap-1">
                <Plus size={12} />
                Erste Quest erstellen
              </Button>
            </div>
          ) : (
            <GraphView
              nodes={nodes}
              edges={edges}
              onNodeClick={handleNodeClick}
              onConnect={handleConnect}
              onEdgesDelete={handleEdgesDelete}
              onReconnect={handleReconnect}
              onEdgeClick={handleEdgeClick}
            />
          )}
        </div>

        {/* Note detail panel */}
        {selectedNote && (
          <div className="w-72 flex-shrink-0 bg-white border-l border-rose-100 overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-amber-100 bg-amber-50">
              <div className="flex items-start gap-2">
                <span className="text-lg flex-shrink-0">📝</span>
                <p className="text-sm font-bold text-amber-900 flex-1">{selectedNote.title || 'Notiz'}</p>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-0.5"
                >
                  <X size={13} />
                </button>
              </div>
              {selectedNote.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedNote.tags.map(tag => (
                    <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-700 font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
              {/* Images gallery */}
              {noteImageUrls.filter(Boolean).length > 0 && (
                <div className="flex flex-col gap-1">
                  {noteImageUrls.map((url, i) =>
                    url ? (
                      <img
                        key={i}
                        src={url}
                        alt=""
                        className="w-full object-cover max-h-48"
                        draggable={false}
                      />
                    ) : null
                  )}
                </div>
              )}

              {/* Content */}
              {selectedNote.content && (
                <div className="px-4 py-2">
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">Inhalt</p>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedNote.content}
                  </p>
                </div>
              )}

              {/* Linked nodes */}
              {selectedNote.linkedNodeIds.length > 0 && (
                <div className="px-4 pb-2">
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">
                    🔗 Verknüpft ({selectedNote.linkedNodeIds.length})
                  </p>
                  <div className="flex flex-col gap-1">
                    {selectedNote.linkedNodeIds.map(nodeId => {
                      const linked = allNodes.find(n => n.id === nodeId) ?? notes.find(n => n.id === nodeId)
                      if (!linked) return null
                      const isNote = linked.type === 'note'
                      return (
                        <button
                          key={nodeId}
                          onClick={() => setSelectedNode(linked as AnyNode | NoteNode)}
                          className="flex items-center gap-1.5 text-left rounded-lg bg-amber-50 px-2 py-1.5 hover:bg-amber-100 transition-colors text-amber-800"
                        >
                          <span>{isNote ? '📝' : linked.type === 'quest' ? '📋' : linked.type === 'item' ? '📦' : '🏗️'}</span>
                          <span className="text-xs truncate">{isNote ? (linked as NoteNode).title : getNodeTitle(linked as AnyNode)}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-4 py-3 border-t border-amber-100 flex items-center gap-2">
              <button
                onClick={() => { setEditNoteTarget(selectedNote); setShowCreateNoteModal(true) }}
                className="flex-1 py-1.5 rounded-xl bg-amber-400 text-white text-xs font-semibold hover:bg-amber-500 transition-colors"
              >
                ✏️ Bearbeiten
              </button>
              <button
                onClick={() => setDeleteConfirmNode(selectedNote)}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
              >
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        )}

        {/* AnyNode detail panel */}
        {selectedAnyNode && (
          <div className="w-72 flex-shrink-0 bg-white border-l border-rose-100 overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-rose-50">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {selectedAnyNode.type === 'quest' ? '📋' : selectedAnyNode.type === 'item' ? '📦' : '🏗️'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">
                    {getNodeTitle(selectedAnyNode)}
                  </p>
                  {selectedAnyNode.type === 'item' && (
                    <p className="text-xs text-pink-400">{selectedAnyNode.mod}</p>
                  )}
                  {selectedAnyNode.type === 'building' && selectedAnyNode.location && (
                    <p className="text-xs text-teal-500">{selectedAnyNode.location}</p>
                  )}
                </div>
                {selectedAnyNode.type !== 'building' && (
                  <button
                    onClick={() => toggleGoal(selectedAnyNode.id)}
                    className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                      isGoal(selectedAnyNode.id)
                        ? 'bg-pink-100 text-pink-500'
                        : 'text-gray-300 hover:text-pink-400'
                    }`}
                    title={isGoal(selectedAnyNode.id) ? 'Ziel entfernen' : 'Als Ziel setzen'}
                  >
                    <Target size={13} />
                  </button>
                )}
              </div>

              {nodeState && (
                <div className="mt-2">
                  <Badge variant={stateVariant[nodeState]}>
                    {stateLabel[nodeState]}
                  </Badge>
                </div>
              )}

              {/* Status actions */}
              <div className="mt-3 flex flex-col gap-1.5">
                {selectedAnyNode.type === 'quest' && (<>
                  <button
                    onClick={() => updateQuest(selectedAnyNode.id, { status: liveQuest?.status === 'done' ? 'open' : 'done' })}
                    className={`w-full py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      liveQuest?.status === 'done'
                        ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        : 'bg-emerald-400 text-white hover:bg-emerald-500'
                    }`}
                  >
                    {liveQuest?.status === 'done' ? '↩ Erledigt zurücksetzen' : '✅ Als erledigt markieren'}
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => updateQuest(selectedAnyNode.id, { status: 'in-progress' })} className={`flex-1 py-1 rounded-lg text-xs font-medium border transition-colors ${liveQuest?.status === 'in-progress' ? 'bg-amber-400 text-white border-amber-400' : 'bg-white text-gray-400 border-gray-200 hover:border-amber-300 hover:text-amber-600'}`}>🔄 In Arbeit</button>
                    <button onClick={() => updateQuest(selectedAnyNode.id, { status: 'open' })} className={`flex-1 py-1 rounded-lg text-xs font-medium border transition-colors ${liveQuest?.status === 'open' ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-white text-gray-400 border-gray-200 hover:border-rose-200 hover:text-rose-500'}`}>⭕ Offen</button>
                  </div>
                </>)}
                {selectedAnyNode.type === 'item' && (<>
                  <button
                    onClick={() => updateItem(selectedAnyNode.id, { status: liveItem?.status === 'have' ? 'needed' : 'have' })}
                    className={`w-full py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      liveItem?.status === 'have'
                        ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        : 'bg-emerald-400 text-white hover:bg-emerald-500'
                    }`}
                  >
                    {liveItem?.status === 'have' ? '↩ Zurücksetzen' : '✅ Als vorhanden markieren'}
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => updateItem(selectedAnyNode.id, { status: 'collecting' })} className={`flex-1 py-1 rounded-lg text-xs font-medium border transition-colors ${liveItem?.status === 'collecting' ? 'bg-purple-400 text-white border-purple-400' : 'bg-white text-gray-400 border-gray-200 hover:border-purple-300 hover:text-purple-600'}`}>📥 Sammle</button>
                    <button onClick={() => updateItem(selectedAnyNode.id, { status: 'needed' })} className={`flex-1 py-1 rounded-lg text-xs font-medium border transition-colors ${liveItem?.status === 'needed' ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-white text-gray-400 border-gray-200 hover:border-rose-200 hover:text-rose-500'}`}>🔍 Gesucht</button>
                  </div>
                </>)}
                {selectedAnyNode.type === 'building' && (<>
                  <button
                    onClick={() => updateBuilding(selectedAnyNode.id, { status: liveBuilding?.status === 'done' ? 'planned' : 'done' })}
                    className={`w-full py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      liveBuilding?.status === 'done'
                        ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        : 'bg-emerald-400 text-white hover:bg-emerald-500'
                    }`}
                  >
                    {liveBuilding?.status === 'done' ? '↩ Zurücksetzen' : '✅ Als fertig markieren'}
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => updateBuilding(selectedAnyNode.id, { status: 'in-progress' })} className={`flex-1 py-1 rounded-lg text-xs font-medium border transition-colors ${liveBuilding?.status === 'in-progress' ? 'bg-teal-400 text-white border-teal-400' : 'bg-white text-gray-400 border-gray-200 hover:border-teal-300 hover:text-teal-600'}`}>🔨 Im Bau</button>
                    <button onClick={() => updateBuilding(selectedAnyNode.id, { status: 'planned' })} className={`flex-1 py-1 rounded-lg text-xs font-medium border transition-colors ${liveBuilding?.status === 'planned' ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-white text-gray-400 border-gray-200 hover:border-rose-200 hover:text-rose-500'}`}>📐 Geplant</button>
                  </div>
                </>)}
              </div>
            </div>

            <div className="flex-1 px-4 py-3 flex flex-col gap-4 text-xs">
              {/* Description / reason */}
              {selectedAnyNode.type === 'quest' && selectedAnyNode.description && (
                <p className="text-gray-600">{selectedAnyNode.description}</p>
              )}
              {selectedAnyNode.type === 'item' && (
                <>
                  {selectedAnyNode.reason && (
                    <div className="rounded-xl bg-rose-50 p-2.5">
                      <p className="font-semibold text-rose-500 mb-1">🤔 Warum?</p>
                      <p className="text-gray-600">{selectedAnyNode.reason}</p>
                    </div>
                  )}
                  {selectedAnyNode.purpose && (
                    <div className="rounded-xl bg-pink-50 p-2.5">
                      <p className="font-semibold text-pink-500 mb-1">🎯 Wofür?</p>
                      <p className="text-gray-600">{selectedAnyNode.purpose}</p>
                    </div>
                  )}
                </>
              )}
              {selectedAnyNode.type === 'building' && (
                <>
                  {selectedAnyNode.style && (
                    <div className="rounded-xl bg-teal-50 p-2.5">
                      <p className="font-semibold text-teal-600 mb-1">🎨 Stil</p>
                      <p className="text-gray-600">{selectedAnyNode.style}</p>
                    </div>
                  )}

                  {/* Material requirements — editable inline */}
                  {(() => {
                    const reqs = (liveBuilding?.itemRequirements ?? [])
                      .map(r => ({ ...r, item: items.find(i => i.id === r.itemId) }))
                      .filter((x): x is typeof x & { item: NonNullable<typeof x.item> } => !!x.item)
                    if (reqs.length === 0) return null
                    const doneCount = reqs.filter(r => r.preparedAmount >= r.requiredAmount).length
                    return (
                      <div>
                        <p className="font-semibold text-gray-500 mb-1.5">
                          📦 Materialien
                          <span className={`ml-1.5 text-xs font-normal ${doneCount === reqs.length ? 'text-emerald-500' : 'text-gray-400'}`}>
                            ({doneCount}/{reqs.length} fertig)
                          </span>
                        </p>
                        <div className="flex flex-col gap-2">
                          {reqs.map(req => {
                            const done = req.preparedAmount >= req.requiredAmount
                            const pct  = req.requiredAmount > 0
                              ? Math.min(100, Math.round((req.preparedAmount / req.requiredAmount) * 100))
                              : 100
                            const toggle = () => {
                              const updated = (liveBuilding!.itemRequirements).map(r =>
                                r.itemId === req.itemId
                                  ? { ...r, preparedAmount: done ? 0 : r.requiredAmount }
                                  : r
                              )
                              updateBuilding(selectedAnyNode.id, { itemRequirements: updated })
                            }
                            const setPrepared = (val: number) => {
                              const updated = (liveBuilding!.itemRequirements).map(r =>
                                r.itemId === req.itemId
                                  ? { ...r, preparedAmount: Math.max(0, isNaN(val) ? 0 : val) }
                                  : r
                              )
                              updateBuilding(selectedAnyNode.id, { itemRequirements: updated })
                            }
                            return (
                              <div key={req.itemId}>
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  {/* Checkbox */}
                                  <button
                                    onClick={toggle}
                                    className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                      done
                                        ? 'bg-emerald-400 border-emerald-400 text-white'
                                        : 'border-gray-300 hover:border-pink-400'
                                    }`}
                                  >
                                    {done && <span className="text-[10px] leading-none">✓</span>}
                                  </button>
                                  {/* Name */}
                                  <span className={`flex-1 truncate text-xs ${done ? 'text-emerald-600 line-through opacity-60' : 'text-gray-700'}`}>
                                    {req.item.name}
                                  </span>
                                  {/* Amount input */}
                                  <div className="flex items-center gap-0.5 flex-shrink-0">
                                    <input
                                      type="number"
                                      min="0"
                                      value={req.preparedAmount || ''}
                                      placeholder="0"
                                      onChange={e => setPrepared(parseInt(e.target.value))}
                                      className="w-9 rounded border border-rose-200 bg-white px-1 py-0.5 text-center text-xs outline-none focus:border-pink-400"
                                    />
                                    <span className="text-gray-400 text-xs">/{req.requiredAmount}</span>
                                  </div>
                                </div>
                                <div className="h-1 rounded-full bg-rose-100/60 ml-5">
                                  <div
                                    className={`h-full rounded-full transition-all ${done ? 'bg-emerald-400' : 'bg-pink-400'}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })()}

                  {selectedAnyNode.requirements.length > 0 && (
                    <div>
                      <p className="font-semibold text-gray-500 mb-1.5">📋 Anforderungen</p>
                      <ul className="flex flex-col gap-0.5">
                        {selectedAnyNode.requirements.map((r, i) => (
                          <li key={i} className="text-gray-600 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-teal-300 flex-shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {/* Blocked by */}
              {blockedBy.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-500 mb-1.5">🔒 Blockiert durch</p>
                  <div className="flex flex-col gap-1">
                    {blockedBy.map(n => (
                      <button
                        key={n.id}
                        onClick={() => setSelectedNode(n)}
                        className="flex items-center gap-1.5 text-left rounded-lg bg-gray-50 px-2 py-1.5 hover:bg-gray-100 transition-colors"
                      >
                        <span>{n.type === 'quest' ? '📋' : n.type === 'item' ? '📦' : '🏗️'}</span>
                        <span className="text-gray-700">{getNodeTitle(n)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Full dep chain */}
              {chain.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-500 mb-1.5">⛓️ Schritte davor ({chain.length})</p>
                  <div className="flex flex-col gap-1">
                    {chain.map((n, i) => (
                      <button
                        key={n.id}
                        onClick={() => setSelectedNode(n)}
                        className={`
                          flex items-center gap-1.5 text-left rounded-lg px-2 py-1.5 transition-colors
                          ${isNodeDone(n) ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}
                          hover:opacity-80
                        `}
                      >
                        <span className="text-gray-400">{i + 1}.</span>
                        <span>{n.type === 'quest' ? '📋' : n.type === 'item' ? '📦' : '🏗️'}</span>
                        <span className="truncate">{getNodeTitle(n)}</span>
                        {isNodeDone(n) && <span className="ml-auto">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Unlocks */}
              {unlocksNodes.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-500 mb-1.5">🔓 Schaltet frei ({unlocksNodes.length})</p>
                  <div className="flex flex-col gap-1">
                    {unlocksNodes.map(n => (
                      <button
                        key={n.id}
                        onClick={() => setSelectedNode(n)}
                        className="flex items-center gap-1.5 text-left rounded-lg bg-purple-50 px-2 py-1.5 hover:bg-purple-100 transition-colors text-purple-700"
                      >
                        <span>{n.type === 'quest' ? '📋' : n.type === 'item' ? '📦' : '🏗️'}</span>
                        <span className="truncate">{getNodeTitle(n)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Crafting deps (items) */}
              {selectedAnyNode.type === 'item' && (() => {
                const craftDeps = selectedAnyNode.dependencies
                  .filter(d => d.type === 'requires' && d.amount != null)
                  .map(d => ({ dep: d, node: allNodes.find(n => n.id === d.targetId) }))
                  .filter((x): x is { dep: typeof x.dep; node: AnyNode } => !!x.node)
                return craftDeps.length > 0 ? (
                  <div>
                    <p className="font-semibold text-gray-500 mb-1.5">🧪 Crafting-Zutaten</p>
                    <div className="flex flex-col gap-1">
                      {craftDeps.map(({ dep, node }) => (
                        <button
                          key={dep.targetId}
                          onClick={() => setSelectedNode(node)}
                          className="flex justify-between rounded-lg bg-gray-50 px-2 py-1.5 hover:bg-gray-100 transition-colors text-left"
                        >
                          <span className="text-gray-700">{getNodeTitle(node)}</span>
                          <span className="font-medium text-pink-500">×{dep.amount}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null
              })()}

              {/* Used in buildings (items/quests) */}
              {usedInBuildings.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-500 mb-1.5">🏗️ Verwendet für Gebäude ({usedInBuildings.length})</p>
                  <div className="flex flex-col gap-1">
                    {usedInBuildings.map(b => (
                      <button
                        key={b.id}
                        onClick={() => setSelectedNode(b)}
                        className="flex items-center gap-1.5 text-left rounded-lg bg-teal-50 px-2 py-1.5 hover:bg-teal-100 transition-colors text-teal-700"
                      >
                        <span>🏗️</span>
                        <span className="truncate">{b.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-rose-50 flex items-center gap-2">
              <button
                onClick={() => setDeleteConfirmNode(selectedAnyNode)}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
                title="Node löschen"
              >
                <Trash2 size={11} />
                Löschen
              </button>
              <button
                onClick={() => setSelectedNode(null)}
                className="ml-auto text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Schließen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create quest modal */}
      {showCreateQuestModal && (
        <GraphCreateQuestModal onClose={() => setShowCreateQuestModal(false)} />
      )}

      {/* Create building modal */}
      {showCreateBuildingModal && (
        <GraphCreateBuildingModal onClose={() => setShowCreateBuildingModal(false)} />
      )}

      {/* Create/edit note modal */}
      {showCreateNoteModal && (
        <NoteForm
          key={showCreateNoteModal ? (editNoteTarget?.id ?? 'new') : 'closed'}
          open={showCreateNoteModal}
          onClose={() => { setShowCreateNoteModal(false); setEditNoteTarget(null) }}
          onSubmit={handleNoteSubmit}
          initialData={editNoteTarget}
          allNodes={allNodes}
          allNotes={notes}
        />
      )}

      {/* Delete confirm dialog */}
      <ConfirmDialog
        open={deleteConfirmNode !== null}
        title={`${
          deleteConfirmNode?.type === 'quest' ? 'Quest' :
          deleteConfirmNode?.type === 'item' ? 'Item' :
          deleteConfirmNode?.type === 'note' ? 'Notiz' : 'Gebäude'
        } löschen?`}
        description="Diese Aktion kann rückgängig gemacht werden."
        confirmLabel="Löschen"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmNode(null)}
      />

      {/* Undo toast */}
      {showUndo && (
        <UndoToast
          message={`"${lastDeletedTitle}" gelöscht`}
          onUndo={handleUndoDelete}
          onDismiss={() => setShowUndo(false)}
        />
      )}
    </div>
  )
}
