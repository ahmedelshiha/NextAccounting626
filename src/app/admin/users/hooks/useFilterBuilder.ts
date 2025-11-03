'use client'

import { useCallback, useState, useMemo } from 'react'
import { AdvancedFilterConfig, FilterGroup, FilterCondition, createEmptyFilterConfig } from '../types/filters'

interface UseFilterBuilderOptions {
  initialConfig?: AdvancedFilterConfig
  onConfigChange?: (config: AdvancedFilterConfig) => void
}

interface UseFilterBuilderReturn {
  config: AdvancedFilterConfig
  setConfig: (config: AdvancedFilterConfig) => void
  updateGroup: (groupId: string, group: FilterGroup) => void
  removeGroup: (groupId: string) => void
  addGroup: () => void
  toggleLogic: () => void
  reset: () => void
  isEmpty: boolean
  totalConditions: number
  isValid: boolean
}

/**
 * Hook for managing advanced filter builder state
 * Provides methods to manipulate filter configuration with proper state management
 */
export function useFilterBuilder({
  initialConfig,
  onConfigChange,
}: UseFilterBuilderOptions = {}): UseFilterBuilderReturn {
  const [config, setConfigState] = useState<AdvancedFilterConfig>(
    initialConfig || createEmptyFilterConfig()
  )

  const setConfig = useCallback((newConfig: AdvancedFilterConfig) => {
    setConfigState(newConfig)
    onConfigChange?.(newConfig)
  }, [onConfigChange])

  const updateGroup = useCallback(
    (groupId: string, updatedGroup: FilterGroup) => {
      setConfig({
        ...config,
        groups: config.groups.map((g) => (g.id === groupId ? updatedGroup : g)),
      })
    },
    [config, setConfig]
  )

  const removeGroup = useCallback(
    (groupId: string) => {
      const newGroups = config.groups.filter((g) => g.id !== groupId)
      if (newGroups.length === 0) {
        // Keep at least one empty group
        const newGroup: FilterGroup = {
          id: `group-${Date.now()}`,
          conditions: [
            {
              id: `condition-${Date.now()}`,
              field: '',
              operator: 'eq',
              value: '',
            },
          ],
          logic: 'AND',
        }
        newGroups.push(newGroup)
      }
      setConfig({
        ...config,
        groups: newGroups,
      })
    },
    [config, setConfig]
  )

  const addGroup = useCallback(() => {
    const newGroup: FilterGroup = {
      id: `group-${Date.now()}`,
      conditions: [
        {
          id: `condition-${Date.now()}`,
          field: '',
          operator: 'eq',
          value: '',
        },
      ],
      logic: 'AND',
    }
    setConfig({
      ...config,
      groups: [...config.groups, newGroup],
    })
  }, [config, setConfig])

  const toggleLogic = useCallback(() => {
    setConfig({
      ...config,
      logic: config.logic === 'AND' ? 'OR' : 'AND',
    })
  }, [config, setConfig])

  const reset = useCallback(() => {
    setConfig(createEmptyFilterConfig())
  }, [setConfig])

  const isEmpty = useMemo(
    () =>
      config.groups.every((group) =>
        group.conditions.every((condition) => !condition.field)
      ),
    [config]
  )

  const totalConditions = useMemo(
    () =>
      config.groups.reduce(
        (count, group) =>
          count +
          group.conditions.length +
          (group.nestedGroups?.length || 0),
        0
      ),
    [config]
  )

  const isValid = useMemo(() => {
    if (isEmpty) return false
    return config.groups.some((group) =>
      group.conditions.some((condition) => !!condition.field)
    )
  }, [config, isEmpty])

  return {
    config,
    setConfig,
    updateGroup,
    removeGroup,
    addGroup,
    toggleLogic,
    reset,
    isEmpty,
    totalConditions,
    isValid,
  }
}
