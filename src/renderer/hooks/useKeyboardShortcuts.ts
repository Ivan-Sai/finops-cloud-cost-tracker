import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Global keyboard shortcuts hook.
 * Must be used inside a Router context.
 */
export function useKeyboardShortcuts(): void {
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      // Don't intercept when typing in inputs/textareas
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        // Allow Escape even in inputs
        if (e.key !== 'Escape') return
      }

      const ctrl = e.ctrlKey || e.metaKey

      if (ctrl && e.key === 'd') {
        e.preventDefault()
        navigate('/')
      } else if (ctrl && e.key === 'e') {
        e.preventDefault()
        navigate('/costs')
      } else if (ctrl && e.key === 'n') {
        e.preventDefault()
        navigate('/budgets?action=create')
      } else if (ctrl && e.key === 'i') {
        e.preventDefault()
        navigate('/import')
      } else if (ctrl && e.key === 'f') {
        e.preventDefault()
        navigate('/costs')
        // Focus search input after navigation
        setTimeout(() => {
          const searchInput = document.querySelector<HTMLInputElement>('.cost-search-input input')
          searchInput?.focus()
        }, 100)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])
}
