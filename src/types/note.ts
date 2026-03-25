export interface NoteLink {
  targetId: string
  addedAt: string
}

export interface NoteNode {
  id: string
  type: 'note'
  title: string
  content: string
  images: string[]        // UUID keys → IndexedDB (legacy 'data:' also supported)
  tags: string[]
  links: NoteLink[]       // IDs referencing QuestNode | ItemNode | Building | NoteNode
  createdAt: string
  updatedAt: string
}
