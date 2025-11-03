'use client'

import React, { useState, useMemo } from 'react'
import {
  Star,
  Trash2,
  Copy,
  Edit2,
  Loader,
  MoreVertical,
  BookmarkedIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useFilterPresets } from '../hooks/useFilterPresets'
import { AdvancedFilterConfig, FilterPresetDTO } from '../types/filters'
import { filterConfigToHumanReadable } from '../utils/filterSerializer'

interface SavedFiltersProps {
  entityType?: string
  onSelectPreset: (preset: FilterPresetDTO, config: AdvancedFilterConfig) => void
  onCreateNew?: () => void
  compact?: boolean
}

/**
 * SavedFilters Component
 * Displays and manages saved filter presets with CRUD operations
 * Features:
 * - List all saved presets
 * - Load preset with one click
 * - Set as default
 * - Rename/edit metadata
 * - Delete presets
 * - Show usage statistics
 * - Filter by search term
 * - Mobile responsive
 */
export const SavedFilters: React.FC<SavedFiltersProps> = ({
  entityType = 'users',
  onSelectPreset,
  onCreateNew,
  compact = false,
}) => {
  const {
    presets,
    loading,
    error,
    selectedPresetId,
    deletePreset,
    loadPreset,
    setAsDefault,
  } = useFilterPresets({ entityType })

  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [isLoadingAction, setIsLoadingAction] = useState<string | null>(null)

  const filteredPresets = useMemo(
    () =>
      presets.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      ),
    [presets, searchQuery]
  )

  const handleSelectPreset = async (preset: FilterPresetDTO) => {
    try {
      setIsLoadingAction(preset.id)
      const loaded = await loadPreset(preset.id)
      const config = typeof loaded.filterConfig === 'string' 
        ? JSON.parse(loaded.filterConfig) 
        : loaded.filterConfig
      onSelectPreset(loaded, config)
    } catch (err) {
      console.error('Failed to load preset:', err)
    } finally {
      setIsLoadingAction(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this preset?')) return
    try {
      await deletePreset(id)
    } catch (err) {
      console.error('Failed to delete preset:', err)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      setIsLoadingAction(id)
      await setAsDefault(id)
    } catch (err) {
      console.error('Failed to set default:', err)
    } finally {
      setIsLoadingAction(null)
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-2">
          <Loader className="w-4 h-4 animate-spin" />
          <span>Loading presets...</span>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-4 border-red-200 bg-red-50">
        <p className="text-sm text-red-600">{error}</p>
      </Card>
    )
  }

  if (compact && presets.length === 0) {
    return (
      <div className="p-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCreateNew}
          className="w-full"
        >
          Save current filter
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Saved Filters</h3>
          <p className="text-sm text-gray-500">
            {filteredPresets.length} of {presets.length} preset{presets.length !== 1 ? 's' : ''}
          </p>
        </div>
        {onCreateNew && (
          <Button onClick={onCreateNew} size="sm">
            Save Current
          </Button>
        )}
      </div>

      {/* Search */}
      {presets.length > 0 && (
        <Input
          type="text"
          placeholder="Search presets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8"
        />
      )}

      {/* Presets List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredPresets.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-gray-500 mb-4">No saved filters</p>
            {onCreateNew && (
              <Button onClick={onCreateNew} variant="outline" size="sm">
                Create your first preset
              </Button>
            )}
          </Card>
        ) : (
          filteredPresets.map((preset) => {
            const config = typeof preset.filterConfig === 'string'
              ? JSON.parse(preset.filterConfig)
              : preset.filterConfig
            const description = filterConfigToHumanReadable(config)
            const isSelected = selectedPresetId === preset.id
            const isLoading = isLoadingAction === preset.id

            return (
              <div
                key={preset.id}
                className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {editingId === preset.id ? (
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="h-7 text-sm flex-1"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          Done
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSelectPreset(preset)}
                            disabled={isLoading}
                            className="font-medium text-sm text-gray-900 hover:text-blue-600 truncate"
                          >
                            {isLoading ? (
                              <Loader className="w-4 h-4 animate-spin inline mr-2" />
                            ) : null}
                            {preset.name}
                          </button>
                          {preset.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {description}
                        </p>
                        {preset.usageCount > 0 && (
                          <p className="text-xs text-gray-400 mt-1">
                            Used {preset.usageCount} time{preset.usageCount !== 1 ? 's' : ''}
                            {preset.lastUsedAt && (
                              <>
                                {' '}
                                (Last: {new Date(preset.lastUsedAt).toLocaleDateString()})
                              </>
                            )}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 shrink-0"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleSelectPreset(preset)}
                        disabled={isLoading}
                      >
                        <BookmarkedIcon className="w-4 h-4 mr-2" />
                        Load Filter
                      </DropdownMenuItem>

                      {!preset.isDefault && (
                        <DropdownMenuItem
                          onClick={() => handleSetDefault(preset.id)}
                          disabled={isLoading}
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Set as Default
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => {
                          setEditingId(preset.id)
                          setEditingName(preset.name)
                        }}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Rename
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(config, null, 2))
                        }}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Config
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => handleDelete(preset.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default SavedFilters
