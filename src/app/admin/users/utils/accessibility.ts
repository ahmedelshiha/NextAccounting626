/**
 * Accessibility Utilities
 * WCAG 2.1 compliance helpers for components
 */

/**
 * Generate ARIA label for filter badge
 */
export function getFilterAriaLabel(
  fieldLabel: string,
  operator: string,
  value: string | number | boolean
): string {
  if (typeof value === 'boolean') {
    return `${fieldLabel} ${operator}`
  }
  return `${fieldLabel} ${operator} ${value}`
}

/**
 * Generate ARIA label for table header with sort indicator
 */
export function getTableHeaderAriaLabel(
  columnName: string,
  isSorted: boolean,
  sortDirection: 'asc' | 'desc' | null
): string {
  if (!isSorted) {
    return `${columnName}, sortable`
  }
  return `${columnName}, sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}`
}

/**
 * Generate ARIA label for pagination button
 */
export function getPaginationAriaLabel(
  action: 'prev' | 'next' | 'first' | 'last' | 'jump',
  currentPage?: number,
  totalPages?: number
): string {
  const labels: Record<string, string> = {
    prev: `Previous page, currently on page ${currentPage} of ${totalPages}`,
    next: `Next page, currently on page ${currentPage} of ${totalPages}`,
    first: 'Go to first page',
    last: `Go to last page (page ${totalPages})`,
    jump: `Jump to specific page (currently on page ${currentPage} of ${totalPages})`,
  }
  return labels[action] || action
}

/**
 * Generate ARIA label for row actions menu
 */
export function getRowActionAriaLabel(itemIdentifier: string): string {
  return `Actions for ${itemIdentifier}`
}

/**
 * Accessible keyboard navigation handler
 * Returns true if the key was handled (Enter, Space)
 */
export function handleAccessibleKeyPress(
  event: React.KeyboardEvent,
  callback: () => void
): boolean {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    callback()
    return true
  }
  return false
}

/**
 * Focus management utility for modals
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',')

  return Array.from(container.querySelectorAll(selector))
}

/**
 * Trap focus within an element (for modals)
 */
export function createFocusTrap(
  container: HTMLElement,
  onEscape?: () => void
): () => void {
  const focusables = getFocusableElements(container)
  const firstFocusable = focusables[0] as HTMLElement
  const lastFocusable = focusables[focusables.length - 1] as HTMLElement

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && onEscape) {
      onEscape()
      return
    }

    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault()
        lastFocusable?.focus()
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault()
        firstFocusable?.focus()
      }
    }
  }

  container.addEventListener('keydown', handleKeyDown)

  return () => {
    container.removeEventListener('keydown', handleKeyDown)
  }
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Check if element is visible to screen readers
 */
export function isAccessiblelyHidden(element: HTMLElement): boolean {
  return (
    element.hidden ||
    element.getAttribute('aria-hidden') === 'true' ||
    window.getComputedStyle(element).display === 'none'
  )
}

/**
 * Get accessible name for an element (similar to browser implementation)
 */
export function getAccessibleName(element: HTMLElement): string {
  // Check aria-label
  const ariaLabel = element.getAttribute('aria-label')
  if (ariaLabel) return ariaLabel

  // Check aria-labelledby
  const labelledBy = element.getAttribute('aria-labelledby')
  if (labelledBy) {
    const label = document.getElementById(labelledBy)
    if (label) return label.textContent || ''
  }

  // Check associated label (for form elements)
  if (element instanceof HTMLInputElement && element.labels?.length) {
    return element.labels[0].textContent || ''
  }

  // Use text content as fallback
  return element.textContent?.trim() || ''
}

/**
 * Validate ARIA attributes on element
 * Returns array of issues found
 */
export function validateAria(element: HTMLElement): string[] {
  const issues: string[] = []

  // Check role
  const role = element.getAttribute('role')
  const validRoles = [
    'button',
    'link',
    'navigation',
    'main',
    'region',
    'search',
    'table',
    'row',
    'columnheader',
  ]

  if (role && !validRoles.includes(role)) {
    issues.push(`Invalid role: ${role}`)
  }

  // Check required attributes for specific roles
  if (role === 'table' && !element.querySelector('[role="row"]')) {
    issues.push('Table role requires row children')
  }

  // Check aria-label or aria-labelledby
  if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
    if (element.getAttribute('role') === 'button' && !element.textContent?.trim()) {
      issues.push('Button requires aria-label or text content')
    }
  }

  return issues
}

/**
 * Create accessible data attributes for testing and debugging
 */
export function createAccessibilityAttrs(
  name: string,
  role?: string,
  label?: string
): Record<string, string> {
  return {
    'data-qa': name,
    ...(role && { role }),
    ...(label && { 'aria-label': label }),
  }
}
