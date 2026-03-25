'use client'

import { useRef, useState } from 'react'
import { Download, Upload, AlertTriangle, CheckCircle2, Moon, Sun, Trash2 } from 'lucide-react'
import { useDarkMode }       from '@/lib/useDarkMode'
import { deleteImages, isDataUrl } from '@/lib/imageStorage'
import { useQuestStore }     from '@/store/useQuestStore'
import { useItemStore }      from '@/store/useItemStore'
import { useBuildingStore }  from '@/store/useBuildingStore'
import { useGoalStore }      from '@/store/useGoalStore'
import { useInventoryStore } from '@/store/useInventoryStore'
import { Button }            from '@/components/ui/Button'
import { ConfirmDialog }     from '@/components/ui/ConfirmDialog'
import type { QuestNode, ItemNode, Building, Goal, InventoryItem } from '@/types'

// ─── Backup schema ────────────────────────────────────────────────────────────

const BACKUP_VERSION = 1

interface BackupData {
  version: number
  exportedAt: string
  appVersion: string
  data: {
    quests:    QuestNode[]
    items:     ItemNode[]
    buildings: Building[]
    goals:     Goal[]
    inventory: InventoryItem[]
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

function isValidBackup(value: unknown): value is BackupData {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  if (obj.appVersion !== 'atm10-tracker') return false
  if (typeof obj.version !== 'number') return false
  const data = obj.data as Record<string, unknown> | undefined
  if (!data) return false
  return (
    Array.isArray(data.quests)    &&
    Array.isArray(data.items)     &&
    Array.isArray(data.buildings) &&
    Array.isArray(data.goals)     &&
    Array.isArray(data.inventory)
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'appearance' | 'backup' | 'reset'

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'appearance', label: 'Darstellung',  emoji: '🎨' },
  { id: 'backup',     label: 'Datensicherung', emoji: '💾' },
  { id: 'reset',      label: 'Zurücksetzen', emoji: '🗑️' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const fileInputRef             = useRef<HTMLInputElement>(null)
  const { dark, toggle: toggleDark } = useDarkMode()

  const [activeTab, setActiveTab]     = useState<Tab>('appearance')
  const [importError,   setImportError]   = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const [pendingBackup, setPendingBackup] = useState<BackupData | null>(null)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetSuccess,    setResetSuccess]    = useState(false)

  // ── Export ────────────────────────────────────────────────────────────────

  const handleExport = () => {
    const backup: BackupData = {
      version:    BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      appVersion: 'atm10-tracker',
      data: {
        quests:    useQuestStore.getState().quests,
        items:     useItemStore.getState().items,
        buildings: useBuildingStore.getState().buildings,
        goals:     useGoalStore.getState().goals,
        inventory: useInventoryStore.getState().inventory,
      },
    }

    const json = JSON.stringify(backup, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const date = new Date().toISOString().slice(0, 10)

    const a = document.createElement('a')
    a.href     = url
    a.download = `atm10-backup-${date}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Import ────────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)
    setImportSuccess(false)
    e.target.value = ''

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        if (!isValidBackup(parsed)) {
          setImportError('Ungültige Backup-Datei. Bitte nur Dateien verwenden, die mit dieser App exportiert wurden.')
          return
        }
        setPendingBackup(parsed)
      } catch {
        setImportError('Die Datei konnte nicht gelesen werden. Ist es eine gültige JSON-Datei?')
      }
    }
    reader.onerror = () => setImportError('Fehler beim Lesen der Datei.')
    reader.readAsText(file)
  }

  const handleImportConfirm = () => {
    if (!pendingBackup) return
    const { quests, items, buildings, goals, inventory } = pendingBackup.data

    useQuestStore.setState({ quests, _dataVersion: 2 })
    useItemStore.setState({ items, _dataVersion: 2 })
    useBuildingStore.setState({ buildings, _dataVersion: 2 })
    useGoalStore.setState({ goals, _dataVersion: 2 })
    useInventoryStore.setState({ inventory })

    setPendingBackup(null)
    setImportSuccess(true)
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

  const handleResetConfirm = async () => {
    // Collect IndexedDB image keys before wiping the building store
    const imageKeys = useBuildingStore.getState().buildings
      .flatMap(b => b.inspoPics.filter(p => !isDataUrl(p)))

    // Wipe all stores
    useQuestStore.setState({ quests: [], _dataVersion: 2, lastDeleted: null })
    useItemStore.setState({ items: [], _dataVersion: 2, lastDeleted: null })
    useBuildingStore.setState({ buildings: [], _dataVersion: 2 })
    useGoalStore.setState({ goals: [], _dataVersion: 2 })
    useInventoryStore.setState({ inventory: [] })

    // Delete images from IndexedDB (fire-and-forget; errors are silently ignored)
    if (imageKeys.length > 0) await deleteImages(imageKeys)

    setShowResetDialog(false)
    setResetSuccess(true)
  }

  // ─── Counts for the reset preview ─────────────────────────────────────────

  const questCount    = useQuestStore(s => s.quests.length)
  const itemCount     = useItemStore(s => s.items.length)
  const buildingCount = useBuildingStore(s => s.buildings.length)
  const goalCount     = useGoalStore(s => s.goals.length)

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto lg:max-w-3xl lg:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">⚙️ Einstellungen</h1>
        <p className="text-xs text-gray-400 mt-0.5">Darstellung, Datensicherung & Zurücksetzen</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-rose-50 rounded-2xl p-1 mb-5">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors
              ${activeTab === tab.id
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'}
            `}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Appearance tab ── */}
      {activeTab === 'appearance' && (
        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-rose-50">
            <h2 className="text-sm font-semibold text-gray-700">🎨 Darstellung</h2>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Dark Mode</p>
                <p className="text-xs text-gray-400 mt-0.5">Dunkles Design aktivieren</p>
              </div>
              <button
                onClick={toggleDark}
                aria-label={dark ? 'Dark Mode deaktivieren' : 'Dark Mode aktivieren'}
                className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2
                  ${dark ? 'bg-pink-400 border-pink-400' : 'bg-gray-200 border-gray-200'}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-flex h-full aspect-square items-center justify-center rounded-full bg-white shadow-sm
                    transition-transform duration-200
                    ${dark ? 'translate-x-5' : 'translate-x-0'}
                  `}
                >
                  {dark
                    ? <Moon size={10} className="text-pink-400" />
                    : <Sun  size={10} className="text-gray-400" />
                  }
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Backup tab ── */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-rose-50">
            <h2 className="text-sm font-semibold text-gray-700">💾 Datensicherung</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Alle deine Daten werden nur lokal im Browser gespeichert. Exportiere regelmäßig ein Backup.
            </p>
          </div>

          <div className="px-5 py-5 flex flex-col gap-6">

            {/* Export */}
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Export</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Exportiert alle Quests, Items, Gebäude, Ziele und Inventar als JSON-Datei.
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-700">
                <span className="font-medium">Hinweis:</span> Gebäude-Bilder werden <strong>nicht</strong> exportiert —
                sie sind im Browser-Speicher (IndexedDB) hinterlegt und bleiben auf diesem Gerät erhalten.
                Nach einem Import auf einem anderen Gerät müssen Bilder erneut hochgeladen werden.
              </div>
              <Button onClick={handleExport} className="gap-2 self-start">
                <Download size={14} />
                Backup herunterladen
              </Button>
            </div>

            <div className="border-t border-rose-50" />

            {/* Import */}
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Import</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Stellt Daten aus einem zuvor exportierten Backup wieder her.
                </p>
              </div>
              <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700">
                <AlertTriangle size={11} className="inline mr-1" />
                <span className="font-medium">Achtung:</span> Der Import überschreibt <strong>alle</strong> aktuellen Daten unwiderruflich.
              </div>
              <Button
                variant="secondary"
                onClick={() => { setImportError(null); setImportSuccess(false); fileInputRef.current?.click() }}
                className="gap-2 self-start"
              >
                <Upload size={14} />
                Backup importieren
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileChange}
              />

              {importError && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">
                  <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                  <p>{importError}</p>
                </div>
              )}

              {importSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-xs text-emerald-700">
                  <CheckCircle2 size={13} />
                  <p>Import erfolgreich! Alle Daten wurden wiederhergestellt.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── Reset tab ── */}
      {activeTab === 'reset' && (
        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-rose-50">
            <h2 className="text-sm font-semibold text-gray-700">🗑️ Alle Daten löschen</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Setzt die App auf den Ausgangszustand zurück.
            </p>
          </div>

          <div className="px-5 py-5 flex flex-col gap-4">

            {/* What will be deleted */}
            <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 flex flex-col gap-2">
              <p className="text-xs font-medium text-gray-500 mb-1">Folgende Daten werden gelöscht:</p>
              {[
                { label: 'Quests',   count: questCount,    emoji: '📋' },
                { label: 'Items',    count: itemCount,     emoji: '📦' },
                { label: 'Gebäude', count: buildingCount, emoji: '🏗️' },
                { label: 'Ziele',   count: goalCount,     emoji: '🎯' },
                { label: 'Bilder',  count: null,          emoji: '🖼️' },
              ].map(({ label, count, emoji }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <span>{emoji}</span>
                    <span>{label}</span>
                  </span>
                  <span className="font-medium text-gray-700">
                    {count !== null ? `${count} Einträge` : 'alle (IndexedDB)'}
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700">
              <AlertTriangle size={11} className="inline mr-1" />
              <span className="font-medium">Achtung:</span> Diese Aktion ist <strong>unwiderruflich</strong>.
              Erstelle vorher ein Backup unter dem Tab &bdquo;Datensicherung&ldquo;.
            </div>

            {resetSuccess && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-xs text-emerald-700">
                <CheckCircle2 size={13} />
                <p>Alle Daten wurden erfolgreich gelöscht.</p>
              </div>
            )}

            <Button
              variant="danger"
              onClick={() => { setResetSuccess(false); setShowResetDialog(true) }}
              className="gap-2 self-start"
            >
              <Trash2 size={14} />
              Alle Daten löschen
            </Button>

          </div>
        </div>
      )}

      {/* Confirm import dialog */}
      <ConfirmDialog
        open={pendingBackup !== null}
        title="Backup importieren?"
        description="Dies überschreibt alle aktuellen Daten (Quests, Items, Gebäude, Ziele, Inventar). Diese Aktion kann nicht rückgängig gemacht werden."
        confirmLabel="Importieren"
        onConfirm={handleImportConfirm}
        onCancel={() => setPendingBackup(null)}
      />

      {/* Confirm reset dialog */}
      <ConfirmDialog
        open={showResetDialog}
        title="Alle Daten wirklich löschen?"
        description="Quests, Items, Gebäude, Ziele, Inventar und alle hochgeladenen Bilder werden unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden."
        confirmLabel="Alles löschen"
        onConfirm={() => { void handleResetConfirm() }}
        onCancel={() => setShowResetDialog(false)}
      />
    </div>
  )
}
