'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { useQuestStore } from '@/store/useQuestStore'
import { useBuildingStore } from '@/store/useBuildingStore'
import { useItemStore } from '@/store/useItemStore'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Rehydrate Zustand persist stores after client mount
  useEffect(() => {
    useQuestStore.persist.rehydrate()
    useBuildingStore.persist.rehydrate()
    useItemStore.persist.rehydrate()
  }, [])

  return (
    <div className="min-h-screen bg-rose-50 flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-rose-100">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-600 transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">⛏️</span>
            <span className="font-bold text-sm text-gray-800">ATM10 Tracker</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
