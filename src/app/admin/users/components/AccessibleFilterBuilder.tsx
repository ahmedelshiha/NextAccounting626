'use client'

import React, { useRef, useEffect } from 'react'
import { FilterBuilder } from './FilterBuilder'
import { AdvancedFilterConfig } from '../types/filters'
import {
  announceToScreenReader,
  createAccessibilityAttrs,
} from '../utils/accessibility'

interface AccessibleFilterBuilderProps {
  onApply: (config: AdvancedFilterConfig) => void
  onSave?: (config: AdvancedFilterConfig, name: string) => Promise<void>
  initialConfig?: AdvancedFilterConfig
  showPreview?: boolean
  previewCount?: number
  isLoading?: boolean
  title?: string
}

/**
 * AccessibleFilterBuilder Component
 * Wrapper around FilterBuilder with enhanced accessibility:
 * - Proper ARIA labels and descriptions
 * - Keyboard navigation support (Tab, Arrow keys)
 * - Screen reader announcements
 * - Focus management
 * - Semantic HTML structure
 */
export const AccessibleFilterBuilder: React.FC<AccessibleFilterBuilderProps> = ({
  onApply,
  onSave,
  initialConfig,
  showPreview = true,
  previewCount,
  isLoading = false,
  title = 'Advanced Filter Builder',
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleApply = (config: AdvancedFilterConfig) => {
    const totalConditions = config.groups.reduce(
      (sum, group) => sum + group.conditions.length,
      0
    )
    announceToScreenReader(
      `Filter applied with ${totalConditions} condition${totalConditions !== 1 ? 's' : ''}`
    )
    onApply(config)
  }

  const handleSave = async (config: AdvancedFilterConfig, name: string) => {
    if (!onSave) return
    try {
      await onSave(config, name)
      announceToScreenReader(`Filter preset '${name}' saved successfully`)
    } catch (err) {
      announceToScreenReader(
        `Error saving filter preset: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'assertive'
      )
      throw err
    }
  }

  useEffect(() => {
    // Announce component to screen readers when it mounts
    announceToScreenReader(`${title} loaded. Use Tab to navigate through filter options.`)
  }, [title])

  return (
    <section
      ref={containerRef}
      aria-label={title}
      aria-describedby="filter-description"
      {...createAccessibilityAttrs('filter-builder', 'region')}
    >
      {/* Description for screen readers */}
      <div id="filter-description" className="sr-only">
        Advanced filter builder for creating complex filter rules. Combine multiple
        conditions with AND/OR logic. Use Tab key to navigate through fields, operators,
        and values.
      </div>

      <FilterBuilder
        onApply={handleApply}
        onSave={onSave ? handleSave : undefined}
        initialConfig={initialConfig}
        showPreview={showPreview}
        previewCount={previewCount}
        isLoading={isLoading}
      />
    </section>
  )
}

export default AccessibleFilterBuilder
