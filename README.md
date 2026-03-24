# ⛏️ ATM10 Tracker — Alina's Quest & Item Planner

Eine persönliche Web-App zum Tracken von Quests, Gebäuden und Items für das Minecraft-Modpack **All the Mods 10**.

---

## Features

### 📋 Quest-System
- Quests erstellen, bearbeiten, löschen
- Status-Zyklen: Offen → In Arbeit → Erledigt
- Prioritäten: Niedrig / Mittel / Hoch
- Kategorien: Progression, Building, Farming, Exploration, Crafting, Automation
- **Abhängigkeiten**: Quests können auf andere aufbauen — gesperrte Quests werden mit 🔒 markiert
- **Questlines**: Parent-Child-Hierarchie für verschachtelte Quests
- Filtern nach Status, Priorität, nur Haupt-Questlines
- Suche nach Titel

### 🏗️ Gebäude-Planer
- Gebäude mit Name, Ort, Stil, Status planen
- Anforderungslisten pro Gebäude
- Notizen & Inspo-Bereich
- Status-Schnellwechsel direkt auf der Karte
- Filtern & Suchen

### 📦 Item-Tracker (JEI-inspiriert)
- Items mit Mod, Status, Grund, Zweck, Zutaten und Notizen tracken
- Status: Gesucht 🔍 / Sammle 📥 / Habe ich ✅
- Verknüpfte Items (klickbar im Detailpanel)
- Detailansicht als Seitenpanel — ohne Seitenwechsel
- Grid- und Listenansicht
- Filter nach Status und Mod, Suche nach Name

### 🏠 Dashboard
- Fortschrittsbalken (erledigte Quests)
- Schnellübersicht: aktive Quests, Gebäude im Bau, gesuchte Items
- Nächste offene Quests und Items auf einen Blick

---

## Tech Stack

| Technologie | Version |
|---|---|
| Next.js (App Router) | 16.2.1 |
| React | 19 |
| TypeScript | 5 |
| Tailwind CSS | 4 |
| Zustand | latest |
| lucide-react | latest |

---

## Lokale Entwicklung

```bash
# Abhängigkeiten installieren
npm install

# Dev-Server starten (läuft auf localhost:3000)
npm run dev

# Production Build
npm run build

# Production Server starten
npm start
```

---

## Projektstruktur

```
src/
├── app/
│   ├── layout.tsx          # Root Layout mit AppShell
│   ├── page.tsx            # Dashboard
│   ├── globals.css         # Globale Styles (Tailwind + Scrollbar)
│   ├── quests/page.tsx     # Quest-Verwaltung
│   ├── buildings/page.tsx  # Gebäude-Planer
│   └── items/page.tsx      # Item-Tracker
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx    # Sidebar-Shell + Store-Hydration
│   │   └── Sidebar.tsx     # Navigation (Mobile Drawer + Desktop)
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx       # Input, Textarea, Select
│   │   ├── Modal.tsx
│   │   └── EmptyState.tsx
│   ├── quests/
│   │   ├── QuestCard.tsx
│   │   └── QuestForm.tsx
│   ├── buildings/
│   │   ├── BuildingCard.tsx
│   │   └── BuildingForm.tsx
│   └── items/
│       ├── ItemCard.tsx
│       ├── ItemForm.tsx
│       └── ItemDetail.tsx
│
├── store/
│   ├── useQuestStore.ts    # Zustand + localStorage
│   ├── useBuildingStore.ts
│   └── useItemStore.ts
│
├── types/
│   └── index.ts            # Alle TypeScript-Interfaces
│
└── data/
    └── mockData.ts         # Beispieldaten (Quests, Gebäude, Items)
```

---

## Datenpersistenz

Alle Daten werden automatisch im **localStorage** des Browsers gespeichert:

| Store | localStorage-Key |
|---|---|
| Quests | `atm10-quests` |
| Gebäude | `atm10-buildings` |
| Items | `atm10-items` |

> Die Daten bleiben nach einem Reload erhalten. Sie sind nur lokal im Browser gespeichert — kein Server, keine Datenbank.

---

## Datenmodelle

### Quest
```ts
interface Quest {
  id: string
  title: string
  description: string
  status: 'open' | 'in-progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  category: 'progression' | 'building' | 'farming' | 'exploration' | 'crafting' | 'automation' | 'other'
  parentId: string | null       // für Questlines
  dependsOn: string[]           // IDs von Quests, die zuerst erledigt sein müssen
  notes: string
  createdAt: string
  updatedAt: string
}
```

### Building
```ts
interface Building {
  id: string
  name: string
  location: string
  style: string
  status: 'planned' | 'in-progress' | 'done'
  requirements: string[]
  inspoPics: string[]
  notes: string
  createdAt: string
  updatedAt: string
}
```

### Item
```ts
interface Item {
  id: string
  name: string
  mod: string
  status: 'needed' | 'collecting' | 'have'
  reason: string                // warum brauche ich das?
  purpose: string               // wofür ist es?
  ingredients: { name: string; amount: number; unit?: string }[]
  linkedItemIds: string[]
  notes: string
  createdAt: string
  updatedAt: string
}
```

---

## Bekannte Einschränkungen

- Keine Bild-Uploads (Inspo-Bilder noch nicht implementiert)
- Kein Confirm-Dialog beim Löschen
- Keine Drag & Drop Sortierung
- Keine Export-Funktion (JSON/CSV)
- Kein Dark Mode
- Keine echten Mod-API-Daten — nur Mock-Daten als Startpunkt
