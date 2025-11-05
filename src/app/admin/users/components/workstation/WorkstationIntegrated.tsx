'use client'

import React, { Suspense, useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { UserItem } from '../../contexts/UsersContextProvider'
import { useUsersContext } from '../../contexts/UsersContextProvider'
import { useWorkstationContext } from '../../contexts/WorkstationContext'
import { WorkstationLayout } from './WorkstationLayout'
import { WorkstationSidebar } from './WorkstationSidebar'
import { WorkstationInsightsPanel } from './WorkstationInsightsPanel'
import type { UserFilters } from '../../types/workstation'
import { UsersTable } from '../UsersTable'
import { QuickActionsBar } from '../QuickActionsBar'
import { OperationsOverviewCards } from '../OperationsOverviewCards'
import { UserProfileDialog } from '../UserProfileDialog'
import { toast } from 'sonner'

interface WorkstationIntegratedProps {
  users: UserItem[]
  stats: any
  isLoading?: boolean
  onAddUser?: () => void
  onImport?: () => void
  onBulkOperation?: () => void
  onExport?: () => void
  onRefresh?: () => void
}

/**
 * WorkstationIntegrated Component
 *
 * Phase 2 Integration: Combines the WorkstationLayout with existing components
 * - Left Sidebar: Filters, Quick Stats, Saved Views
 * - Main Content: Actions, Metrics Cards, User Directory (Table)
 * - Right Insights: Analytics, Recommendations
 *
 * Features:
 * - Filter state management with context and URL persistence
 * - Real-time quick stats updates
 * - Bulk user selection and actions
 * - Saved views management
 * - Responsive layout (desktop/tablet/mobile)
 * - Full accessibility support
 */
export function WorkstationIntegrated({
  users,
  stats,
  isLoading = false,
  onAddUser,
  onImport,
  onBulkOperation,
  onExport,
  onRefresh,
}: WorkstationIntegratedProps) {
  const context = useUsersContext()
  const workstationContext = useWorkstationContext()

  // Filter state from context
  const [filters, setFilters] = useState<UserFilters>(() => {
    // Load filters from URL params or localStorage
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return {
        search: params.get('search') || '',
        role: params.get('role') || '',
        status: params.get('status') || '',
        department: params.get('department') || '',
        dateRange: (params.get('dateRange') as 'all' | 'today' | 'week' | 'month') || 'all',
      }
    }
    return {
      search: '',
      role: '',
      status: '',
      department: '',
      dateRange: 'all',
    }
  })

  // Update workstation context filters when local filters change
  useEffect(() => {
    workstationContext.setFilters(filters)
  }, [filters, workstationContext])

  // Persist filters to URL on change
  const handleFiltersChange = useCallback((newFilters: UserFilters) => {
    setFilters(newFilters)

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams()
      if (newFilters.search) params.set('search', newFilters.search)
      if (newFilters.role) params.set('role', newFilters.role)
      if (newFilters.status) params.set('status', newFilters.status)
      if (newFilters.department) params.set('department', newFilters.department)
      if (newFilters.dateRange && newFilters.dateRange !== 'all') params.set('dateRange', newFilters.dateRange)

      const queryString = params.toString()
      const newUrl = queryString
        ? `${window.location.pathname}?${queryString}`
        : window.location.pathname

      window.history.replaceState({}, '', newUrl)
    }
  }, [])

  // Apply saved view filter
  const handleApplySavedView = useCallback((viewName: string, roleFilter?: string) => {
    const newFilters: UserFilters = {
      search: '',
      role: roleFilter ? (roleFilter as any) : undefined,
      status: undefined,
      department: undefined,
      dateRange: 'all',
    }
    handleFiltersChange(newFilters)
  }, [handleFiltersChange])

  // Handle opening user profile dialog
  const handleViewProfile = useCallback((user: UserItem) => {
    context.setSelectedUser(user)
    context.setProfileOpen(true)
  }, [context])

  // Handle selection updates from table
  const handleSelectUserSelection = useCallback((userId: string, selected: boolean) => {
    const next = new Set(workstationContext.selectedUserIds)
    if (selected) next.add(userId); else next.delete(userId)
    workstationContext.setSelectedUserIds(next)
  }, [workstationContext])

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      workstationContext.setSelectedUserIds(new Set(users.map(u => u.id)))
    } else {
      workstationContext.setSelectedUserIds(new Set())
    }
  }, [users, workstationContext])

  // Clear selection
  const handleClearSelection = useCallback(() => {
    workstationContext.setSelectedUserIds(new Set())
  }, [workstationContext])

  // Apply bulk action
  const handleApplyBulkAction = useCallback(async () => {
    if (!workstationContext.bulkActionType || workstationContext.selectedUserIds.size === 0) {
      toast.error('Please select users and action type')
      return
    }

    try {
      await workstationContext.applyBulkAction()
      toast.success('Bulk action applied successfully')
      handleClearSelection()
    } catch (error) {
      toast.error('Failed to apply bulk action')
      console.error('Bulk action error:', error)
    }
  }, [workstationContext, handleClearSelection])

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      await onRefresh()
    }
    await workstationContext.refreshQuickStats()
  }, [onRefresh, workstationContext])

  // Sidebar props for WorkstationSidebar
  const sidebarProps = {
    isOpen: workstationContext.sidebarOpen,
    onClose: () => workstationContext.setSidebarOpen(false),
    filters,
    onFiltersChange: handleFiltersChange,
    stats,
    onAddUser,
    onReset: () => handleFiltersChange({} as any),
  }

  // Memoized main content
  const mainContent = (
    <div className="workstation-main-wrapper flex flex-col h-full gap-4 overflow-y-auto" data-testid="workstation-main-content">
      <QuickActionsBar
        onAddUser={onAddUser}
        onImport={onImport}
        onBulkOperation={onBulkOperation}
        onExport={onExport}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        data-testid="quick-actions-bar"
      />

      <OperationsOverviewCards
        metrics={{
          totalUsers: (stats as any)?.total || users.length,
          pendingApprovals: 0,
          inProgressWorkflows: 0,
          dueThisWeek: 0,
        }}
        isLoading={isLoading}
        data-testid="operations-overview-cards"
      />

      <div className="workstation-table-section flex-1 flex flex-col min-h-0" data-testid="user-directory-section">
        <h2 className="text-lg font-semibold mb-4" data-testid="user-directory-title">User Directory</h2>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <UsersTable
              users={users}
              isLoading={isLoading}
              onViewProfile={handleViewProfile}
              selectedUserIds={workstationContext.selectedUserIds}
              onSelectUser={handleSelectUserSelection}
              onSelectAll={handleSelectAll}
            />
          )}
        </div>
      </div>
    </div>
  )

  // Memoized insights content
  const insightsContent = (
    <div className="workstation-insights-content">
      <Suspense fallback={<div className="p-4">Loading insights...</div>}>
        <WorkstationInsightsPanel
          isOpen={workstationContext.insightsPanelOpen}
          onClose={() => workstationContext.setInsightsPanelOpen(false)}
          stats={stats}
        />
      </Suspense>
    </div>
  )

  return (
    <>
      <WorkstationLayout
        sidebar={<WorkstationSidebar {...sidebarProps} />}
        main={mainContent}
        insights={insightsContent}
      />
      <UserProfileDialog />
    </>
  )
}
