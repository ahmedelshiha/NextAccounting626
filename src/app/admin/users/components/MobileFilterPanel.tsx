'use client'

import React, { useState } from 'react'
import { X, Filter, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface FilterPanelProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  activeFilterCount?: number
  onApply?: () => void
  onReset?: () => void
  loading?: boolean
}

/**
 * MobileFilterPanel Component
 * Sheet-based filter panel optimized for mobile/touch
 * Features:
 * - Bottom sheet on mobile
 * - Full height on small screens
 * - Large touch targets
 * - Clear apply/reset actions
 * - Active filter counter
 * - Smooth animations
 * - Proper accessibility
 */
export function MobileFilterPanel({
  isOpen,
  onClose,
  children,
  title = 'Filters',
  activeFilterCount = 0,
  onApply,
  onReset,
  loading = false,
}: FilterPanelProps) {
  const isMobile = useMediaQuery('(max-width: 640px)')

  if (!isMobile) {
    return <>{children}</>
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="h-[90vh] rounded-t-2xl"
        aria-label={title}
      >
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="flex items-center gap-2">
            <SheetTitle className="text-lg">{title}</SheetTitle>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 -mr-2"
            aria-label="Close filters"
          >
            <X className="h-4 w-4" />
          </Button>
        </SheetHeader>

        {/* Filter content */}
        <div className="overflow-y-auto py-4 space-y-4">
          {children}
        </div>

        {/* Actions */}
        <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4 space-y-2">
          {onReset && (
            <Button
              variant="outline"
              onClick={onReset}
              disabled={loading || activeFilterCount === 0}
              className="w-full"
            >
              Clear Filters
            </Button>
          )}
          {onApply && (
            <Button
              onClick={onApply}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Applying...' : 'Apply Filters'}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

interface MobileFilterToggleProps {
  activeFilterCount: number
  onClick: () => void
}

/**
 * MobileFilterToggle Component
 * Header button for opening filter panel on mobile
 */
export function MobileFilterToggle({
  activeFilterCount,
  onClick,
}: MobileFilterToggleProps) {
  const isMobile = useMediaQuery('(max-width: 640px)')

  if (!isMobile) {
    return null
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="relative"
      aria-label={`Open filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}
    >
      <Filter className="h-4 w-4 mr-2" />
      <span className="hidden sm:inline">Filters</span>
      {activeFilterCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {activeFilterCount}
        </Badge>
      )}
    </Button>
  )
}

export default MobileFilterPanel
