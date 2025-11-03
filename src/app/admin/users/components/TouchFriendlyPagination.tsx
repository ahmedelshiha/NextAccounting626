'use client'

import React, { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
  isLoading?: boolean
}

/**
 * TouchFriendlyPagination Component
 * Mobile-optimized pagination with:
 * - Large touch targets (min 44px)
 * - Swipe gesture support (future)
 * - Compact layout on mobile
 * - Page size selector
 * - Quick jump to page
 * - Accessibility support
 */
export function TouchFriendlyPagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  isLoading = false,
}: PaginationProps) {
  const [jumpToPage, setJumpToPage] = useState('')
  const [showJumpInput, setShowJumpInput] = useState(false)

  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault()
    const pageNum = parseInt(jumpToPage)
    if (pageNum > 0 && pageNum <= totalPages) {
      onPageChange(pageNum)
      setJumpToPage('')
      setShowJumpInput(false)
    }
  }

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 sm:px-0">
      {/* Info text */}
      <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
        Showing{' '}
        <span className="font-medium">
          {startItem} - {endItem}
        </span>{' '}
        of <span className="font-medium">{totalItems}</span> items
      </div>

      {/* Page size selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="pageSize" className="text-xs sm:text-sm text-gray-600">
          Per page:
        </label>
        <Select
          value={pageSize.toString()}
          onValueChange={(val) => {
            onPageSizeChange(parseInt(val))
            onPageChange(1) // Reset to first page
          }}
          disabled={isLoading}
        >
          <SelectTrigger className="w-16 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* First page button (hidden on mobile) */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || isLoading}
          className="hidden sm:flex h-9 w-9 p-0"
          aria-label="Go to first page"
          title="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous page button (large touch target) */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className="h-10 w-10 sm:h-9 sm:w-9 p-0"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page numbers or jump input */}
        {showJumpInput ? (
          <form
            onSubmit={handleJumpToPage}
            className="flex gap-1 items-center"
          >
            <Input
              type="number"
              min="1"
              max={totalPages}
              placeholder="Page"
              value={jumpToPage}
              onChange={(e) => setJumpToPage(e.target.value)}
              className="w-12 h-9 text-sm text-center"
              autoFocus
            />
            <Button
              type="submit"
              size="sm"
              variant="default"
              className="h-9 px-2 text-xs"
            >
              Go
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowJumpInput(false)
                setJumpToPage('')
              }}
              className="h-9 w-9 p-0"
            >
              ✕
            </Button>
          </form>
        ) : (
          <button
            onClick={() => setShowJumpInput(true)}
            className="px-3 h-10 sm:h-9 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            disabled={totalPages <= 1 || isLoading}
            aria-label="Jump to page"
            title="Click to jump to a specific page"
          >
            {currentPage} / {totalPages}
          </button>
        )}

        {/* Next page button (large touch target) */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className="h-10 w-10 sm:h-9 sm:w-9 p-0"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last page button (hidden on mobile) */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || isLoading}
          className="hidden sm:flex h-9 w-9 p-0"
          aria-label="Go to last page"
          title="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default TouchFriendlyPagination
