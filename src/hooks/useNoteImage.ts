'use client'

import { useState, useEffect } from 'react'
import { getImageBlob, isDataUrl } from '@/lib/imageStorage'

/** Loads a single note/building image from IndexedDB and returns an object URL. */
export function useNoteImage(key: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!key) { setUrl(null); return }
    if (isDataUrl(key)) { setUrl(key); return }

    let objUrl: string | null = null
    getImageBlob(key)
      .then(blob => {
        if (!blob) return
        objUrl = URL.createObjectURL(blob)
        setUrl(objUrl)
      })
      .catch(() => {})

    return () => {
      if (objUrl) URL.revokeObjectURL(objUrl)
    }
  }, [key])

  return url
}
