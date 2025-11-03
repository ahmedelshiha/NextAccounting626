'use client'

import { useCallback, useEffect, useState } from 'react'
import { AdvancedFilterConfig, FilterPresetDTO } from '../types/filters'
import { useSession } from 'next-auth/react'

interface UseFilterPresetsOptions {
  entityType?: string
}

interface UseFilterPresetsReturn {
  presets: FilterPresetDTO[]
  loading: boolean
  error: string | null
  selectedPresetId: string | null
  selectedPreset: FilterPresetDTO | null
  savePreset: (name: string, config: AdvancedFilterConfig, description?: string) => Promise<FilterPresetDTO>
  updatePreset: (id: string, name: string, description?: string) => Promise<FilterPresetDTO>
  deletePreset: (id: string) => Promise<void>
  loadPreset: (id: string) => Promise<FilterPresetDTO>
  selectPreset: (id: string | null) => void
  setAsDefault: (id: string) => Promise<void>
  refreshPresets: () => Promise<void>
}

/**
 * Hook for managing saved filter presets
 * Handles CRUD operations for filter presets with proper error handling
 */
export function useFilterPresets({
  entityType = 'users',
}: UseFilterPresetsOptions = {}): UseFilterPresetsReturn {
  const { data: session } = useSession()
  const [presets, setPresets] = useState<FilterPresetDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)

  const selectedPreset = presets.find((p) => p.id === selectedPresetId) || null

  const refreshPresets = useCallback(async () => {
    if (!session?.user) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/admin/filter-presets?entityType=${entityType}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch presets')
      }

      const data = await response.json()
      setPresets(data.presets || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      console.error('Failed to fetch presets:', err)
    } finally {
      setLoading(false)
    }
  }, [session?.user, entityType])

  useEffect(() => {
    refreshPresets()
  }, [refreshPresets])

  const savePreset = useCallback(
    async (
      name: string,
      config: AdvancedFilterConfig,
      description?: string
    ): Promise<FilterPresetDTO> => {
      if (!session?.user) {
        throw new Error('Not authenticated')
      }

      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/admin/filter-presets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            description,
            entityType,
            filterConfig: config,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to save preset')
        }

        const preset = await response.json()
        setPresets((prev) => [...prev, preset])
        return preset
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save preset'
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [session?.user, entityType]
  )

  const updatePreset = useCallback(
    async (
      id: string,
      name: string,
      description?: string
    ): Promise<FilterPresetDTO> => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/admin/filter-presets/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            description,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update preset')
        }

        const updatedPreset = await response.json()
        setPresets((prev) =>
          prev.map((p) => (p.id === id ? updatedPreset : p))
        )
        return updatedPreset
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update preset'
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const deletePreset = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/filter-presets/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete preset')
      }

      setPresets((prev) => prev.filter((p) => p.id !== id))
      if (selectedPresetId === id) {
        setSelectedPresetId(null)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete preset'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [selectedPresetId])

  const loadPreset = useCallback(
    async (id: string): Promise<FilterPresetDTO> => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/admin/filter-presets/${id}`, {
          method: 'GET',
        })

        if (!response.ok) {
          throw new Error('Failed to load preset')
        }

        const preset = await response.json()
        setSelectedPresetId(id)

        // Update usage count
        await fetch(`/api/admin/filter-presets/${id}/track-usage`, {
          method: 'POST',
        }).catch(() => {
          // Silently fail if tracking fails
        })

        return preset
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load preset'
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const selectPreset = useCallback((id: string | null) => {
    setSelectedPresetId(id)
  }, [])

  const setAsDefault = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/filter-presets/${id}/set-default`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to set as default')
      }

      const updatedPreset = await response.json()
      setPresets((prev) =>
        prev.map((p) => ({
          ...p,
          isDefault: p.id === id,
        }))
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set as default'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    presets,
    loading,
    error,
    selectedPresetId,
    selectedPreset,
    savePreset,
    updatePreset,
    deletePreset,
    loadPreset,
    selectPreset,
    setAsDefault,
    refreshPresets,
  }
}
