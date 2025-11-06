import React from 'react'
import { render, screen } from '@testing-library/react'
import { useAdminWorkBenchFeature } from '@/hooks/useAdminWorkBenchFeature'
import ExecutiveDashboardTabWrapper from '../ExecutiveDashboardTabWrapper'

// Mock the feature flag hook
jest.mock('@/hooks/useAdminWorkBenchFeature')
jest.mock('../workbench/AdminWorkBench', () => ({
  default: () => <div data-testid="admin-workbench">AdminWorkBench UI</div>
}))
jest.mock('../tabs/ExecutiveDashboardTab', () => ({
  ExecutiveDashboardTab: () => <div data-testid="legacy-dashboard">Legacy Dashboard</div>
}))

describe('ExecutiveDashboardTabWrapper', () => {
  it('renders AdminWorkBench when feature flag is enabled', () => {
    ;(useAdminWorkBenchFeature as jest.Mock).mockReturnValue({
      enabled: true,
      globalEnabled: true,
      userEnabled: true,
      config: {}
    })

    render(<ExecutiveDashboardTabWrapper />)
    
    expect(screen.getByTestId('admin-workbench')).toBeInTheDocument()
    expect(screen.queryByTestId('legacy-dashboard')).not.toBeInTheDocument()
  })

  it('renders legacy dashboard when feature flag is disabled', () => {
    ;(useAdminWorkBenchFeature as jest.Mock).mockReturnValue({
      enabled: false,
      globalEnabled: false,
      userEnabled: false,
      config: {}
    })

    render(<ExecutiveDashboardTabWrapper />)
    
    expect(screen.getByTestId('legacy-dashboard')).toBeInTheDocument()
    expect(screen.queryByTestId('admin-workbench')).not.toBeInTheDocument()
  })

  it('renders legacy dashboard when global flag is disabled', () => {
    ;(useAdminWorkBenchFeature as jest.Mock).mockReturnValue({
      enabled: false,
      globalEnabled: false,
      userEnabled: true,
      config: {}
    })

    render(<ExecutiveDashboardTabWrapper />)
    
    expect(screen.getByTestId('legacy-dashboard')).toBeInTheDocument()
  })

  it('renders legacy dashboard when user is not in rollout', () => {
    ;(useAdminWorkBenchFeature as jest.Mock).mockReturnValue({
      enabled: false,
      globalEnabled: true,
      userEnabled: false,
      config: { rolloutPercentage: 10 }
    })

    render(<ExecutiveDashboardTabWrapper />)
    
    expect(screen.getByTestId('legacy-dashboard')).toBeInTheDocument()
  })
})
