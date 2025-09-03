'use client'

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react'
import { NavigationState, NavigationAction } from '@/types/navigation'
import { NAVIGATION_CONFIG } from '@/constants/navigation'

const initialState: NavigationState = {
  isCollapsed: false,
  activeItem: '',
  openSections: NAVIGATION_CONFIG.sections
    .filter(section => section.defaultOpen)
    .map(section => section.id),
  isMobileOpen: false
}

function navigationReducer(state: NavigationState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case 'TOGGLE_COLLAPSE':
      return {
        ...state,
        isCollapsed: !state.isCollapsed
      }
    
    case 'SET_COLLAPSED':
      return {
        ...state,
        isCollapsed: action.payload
      }
    
    case 'SET_ACTIVE_ITEM':
      return {
        ...state,
        activeItem: action.payload
      }
    
    case 'TOGGLE_SECTION':
      return {
        ...state,
        openSections: state.openSections.includes(action.payload)
          ? state.openSections.filter(id => id !== action.payload)
          : [...state.openSections, action.payload]
      }
    
    case 'SET_MOBILE_OPEN':
      return {
        ...state,
        isMobileOpen: action.payload
      }
    
    case 'TOGGLE_MOBILE':
      return {
        ...state,
        isMobileOpen: !state.isMobileOpen
      }
    
    default:
      return state
  }
}

interface NavigationContextType {
  state: NavigationState
  dispatch: React.Dispatch<NavigationAction>
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setActiveItem: (item: string) => void
  toggleSection: (sectionId: string) => void
  toggleMobileNav: () => void
  setMobileNavOpen: (open: boolean) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

interface NavigationProviderProps {
  children: React.ReactNode
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const [state, dispatch] = useReducer(navigationReducer, initialState)

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_COLLAPSE' })
  }, [])

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    dispatch({ type: 'SET_COLLAPSED', payload: collapsed })
  }, [])

  const setActiveItem = useCallback((item: string) => {
    dispatch({ type: 'SET_ACTIVE_ITEM', payload: item })
  }, [])

  const toggleSection = useCallback((sectionId: string) => {
    dispatch({ type: 'TOGGLE_SECTION', payload: sectionId })
  }, [])

  const toggleMobileNav = useCallback(() => {
    dispatch({ type: 'TOGGLE_MOBILE' })
  }, [])

  const setMobileNavOpen = useCallback((open: boolean) => {
    dispatch({ type: 'SET_MOBILE_OPEN', payload: open })
  }, [])

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024 // lg breakpoint
      if (!isMobile && state.isMobileOpen) {
        dispatch({ type: 'SET_MOBILE_OPEN', payload: false })
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [state.isMobileOpen])

  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed')
    if (savedState !== null) {
      dispatch({ type: 'SET_COLLAPSED', payload: JSON.parse(savedState) })
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(state.isCollapsed))
  }, [state.isCollapsed])

  const value: NavigationContextType = useMemo(() => ({
    state,
    dispatch,
    toggleSidebar,
    setSidebarCollapsed,
    setActiveItem,
    toggleSection,
    toggleMobileNav,
    setMobileNavOpen
  }), [
    state,
    toggleSidebar,
    setSidebarCollapsed,
    setActiveItem,
    toggleSection,
    toggleMobileNav,
    setMobileNavOpen
  ])

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}
