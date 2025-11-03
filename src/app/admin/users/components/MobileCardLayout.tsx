'use client'

import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface MobileCardField {
  key: string
  label: string
  render?: (value: any) => React.ReactNode
  badge?: boolean
  highlight?: boolean
}

export interface MobileCardAction {
  label: string
  icon?: React.ReactNode
  onClick: (item: any) => void
  variant?: 'default' | 'secondary' | 'destructive'
}

export interface MobileCardLayoutProps<T extends { id: string }> {
  items: T[]
  fields: MobileCardField[]
  actions?: MobileCardAction[]
  onCardClick?: (item: T) => void
  loading?: boolean
  emptyState?: React.ReactNode
}

/**
 * MobileCardLayout Component
 * Renders data as cards optimized for mobile/touch interfaces
 * - Larger touch targets
 * - Card-based layout instead of tables
 * - Responsive field display
 * - Touch-friendly action buttons
 */
export function MobileCardLayout<T extends { id: string }>({
  items,
  fields,
  actions,
  onCardClick,
  loading = false,
  emptyState,
}: MobileCardLayoutProps<T>) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              <div className="h-3 bg-gray-100 rounded w-2/3"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      emptyState || (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No items to display</p>
        </Card>
      )
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card
          key={item.id}
          className="overflow-hidden hover:shadow-md transition-shadow"
          role="article"
          aria-label={`Item ${item.id}`}
        >
          <CardHeader className="pb-3 pt-4 px-4">
            <div className="flex items-start justify-between gap-3">
              <div
                className="flex-1 cursor-pointer min-w-0"
                onClick={() => onCardClick?.(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onCardClick?.(item)
                  }
                }}
              >
                {/* Primary field */}
                {fields.length > 0 && (
                  <h3 className="font-semibold text-base text-gray-900 truncate">
                    {fields[0].render
                      ? fields[0].render(item[fields[0].key as keyof T])
                      : (item[fields[0].key as keyof T] as any)?.toString() || '-'}
                  </h3>
                )}
              </div>

              {/* Actions Menu */}
              {actions && actions.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      aria-label="More actions"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {actions.map((action, idx) => (
                      <DropdownMenuItem
                        key={idx}
                        onClick={() => action.onClick(item)}
                        className={
                          action.variant === 'destructive'
                            ? 'text-red-600'
                            : ''
                        }
                      >
                        {action.icon && (
                          <span className="mr-2 flex-shrink-0">
                            {action.icon}
                          </span>
                        )}
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-0 px-4 pb-4">
            <div className="space-y-2.5">
              {/* Secondary fields */}
              {fields.slice(1).map((field) => {
                const value = item[field.key as keyof T]
                if (!value) return null

                return (
                  <div key={field.key} className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">
                      {field.label}
                    </span>
                    <div className="text-right">
                      {field.badge ? (
                        <Badge variant="secondary" className="text-xs">
                          {field.render ? field.render(value) : value?.toString()}
                        </Badge>
                      ) : (
                        <span
                          className={`text-sm ${
                            field.highlight
                              ? 'font-semibold text-gray-900'
                              : 'text-gray-600'
                          }`}
                        >
                          {field.render ? field.render(value) : value?.toString()}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>

          {/* Quick action buttons */}
          {actions && actions.length > 0 && (
            <div className="flex gap-2 px-4 pb-3">
              {actions.slice(0, 2).map((action, idx) => (
                <Button
                  key={idx}
                  size="sm"
                  variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                  className="flex-1 text-xs"
                  onClick={() => action.onClick(item)}
                >
                  {action.label}
                </Button>
              ))}
              {actions.length > 2 && (
                <Button variant="outline" size="sm" className="px-2">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}

export default MobileCardLayout
