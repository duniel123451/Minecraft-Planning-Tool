'use client'

import Link from 'next/link'
import { useQuestStore } from '@/store/useQuestStore'
import { useBuildingStore } from '@/store/useBuildingStore'
import { useItemStore } from '@/store/useItemStore'
import { Badge } from '@/components/ui/Badge'

function StatCard({
  emoji,
  label,
  value,
  sub,
  href,
}: {
  emoji: string
  label: string
  value: number
  sub: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-2xl border border-rose-100 p-4 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4"
    >
      <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center text-xl flex-shrink-0">
        {emoji}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-xs font-medium text-gray-600">{label}</p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const quests = useQuestStore((s) => s.quests)
  const buildings = useBuildingStore((s) => s.buildings)
  const items = useItemStore((s) => s.items)

  const questStats = {
    total: quests.length,
    done: quests.filter((q) => q.status === 'done').length,
    inProgress: quests.filter((q) => q.status === 'in-progress').length,
    open: quests.filter((q) => q.status === 'open').length,
  }

  const buildingStats = {
    total: buildings.length,
    done: buildings.filter((b) => b.status === 'done').length,
    inProgress: buildings.filter((b) => b.status === 'in-progress').length,
  }

  const itemStats = {
    total: items.length,
    have: items.filter((i) => i.status === 'have').length,
    needed: items.filter((i) => i.status === 'needed').length,
  }

  const recentQuests = quests
    .filter((q) => q.status !== 'done')
    .sort((a, b) => {
      const pOrder = { high: 0, medium: 1, low: 2 }
      return pOrder[a.priority] - pOrder[b.priority]
    })
    .slice(0, 5)

  const recentItems = items.filter((i) => i.status !== 'have').slice(0, 5)

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto lg:max-w-none lg:px-8">
      {/* Hero */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Hallo Alina! 🌸</h1>
        <p className="text-sm text-gray-500 mt-1">Dein ATM10 Fortschritts-Dashboard</p>
      </div>

      {/* Progress banner */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-pink-400 to-rose-400 p-4 text-white shadow-sm">
        <p className="text-xs font-medium opacity-80 mb-1">Gesamt-Fortschritt</p>
        <p className="text-lg font-bold">
          {questStats.done}/{questStats.total} Quests erledigt
        </p>
        <div className="mt-2 h-2 rounded-full bg-white/30">
          <div
            className="h-2 rounded-full bg-white transition-all duration-500"
            style={{
              width: questStats.total
                ? `${(questStats.done / questStats.total) * 100}%`
                : '0%',
            }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        <StatCard
          emoji="📋"
          label="Aktive Quests"
          value={questStats.inProgress}
          sub={`${questStats.open} offen · ${questStats.done} erledigt`}
          href="/quests"
        />
        <StatCard
          emoji="🏗️"
          label="Gebäude im Bau"
          value={buildingStats.inProgress}
          sub={`${buildingStats.total - buildingStats.done} aktiv · ${buildingStats.done} fertig`}
          href="/buildings"
        />
        <StatCard
          emoji="📦"
          label="Items gesucht"
          value={itemStats.needed}
          sub={`${itemStats.have} habe ich · ${itemStats.total} total`}
          href="/items"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent quests */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">📋 Nächste Quests</h2>
            <Link href="/quests" className="text-xs text-pink-500 hover:text-pink-600">
              Alle →
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {recentQuests.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Alle Quests erledigt! 🎉</p>
            ) : (
              recentQuests.map((q) => (
                <div
                  key={q.id}
                  className="bg-white rounded-xl border border-rose-100 px-3 py-2.5 flex items-center gap-2"
                >
                  <span className="text-sm">{q.status === 'in-progress' ? '🔄' : '⭕'}</span>
                  <span className="text-sm text-gray-700 flex-1 truncate">{q.title}</span>
                  <Badge
                    variant={
                      q.priority === 'high' ? 'red' : q.priority === 'medium' ? 'amber' : 'gray'
                    }
                  >
                    {q.priority}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Items needed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">📦 Items die ich brauche</h2>
            <Link href="/items" className="text-xs text-pink-500 hover:text-pink-600">
              Alle →
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {recentItems.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Alle Items gesammelt! ✨</p>
            ) : (
              recentItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-rose-100 px-3 py-2.5 flex items-center gap-2"
                >
                  <span className="text-sm">{item.status === 'collecting' ? '📥' : '🔍'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{item.name}</p>
                    <p className="text-xs text-pink-400">{item.mod}</p>
                  </div>
                  <Badge variant={item.status === 'collecting' ? 'amber' : 'red'}>
                    {item.status === 'collecting' ? 'Sammle' : 'Gesucht'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
