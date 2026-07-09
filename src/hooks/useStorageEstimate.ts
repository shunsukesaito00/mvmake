import { useEffect, useState } from 'react'
import { getStorageEstimate, type StorageEstimate } from '../persistence/storageUtils'

export function useStorageEstimate(refreshKey: number): StorageEstimate | null {
  const [estimate, setEstimate] = useState<StorageEstimate | null>(null)

  useEffect(() => {
    let cancelled = false
    void getStorageEstimate().then((value) => {
      if (!cancelled) setEstimate(value)
    })
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  return estimate
}
