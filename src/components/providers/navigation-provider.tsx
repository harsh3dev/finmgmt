'use client'

import React, { createContext, useContext, useEffect, useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { 
  toggleSidebar as toggleSidebarAction,
  setSidebarCollapsed as setSidebarCollapsedAction,
  setActiveRoute,
  setIsMobile,
  toggleMobileNav as toggleMobileNavAction,
  setMobileNavOpen as setMobileNavOpenAction
} from '@/store/slices/navigationSlice'
import { NAVIGATION_CONFIG } from '@/constants/navigation'

// Extended state for section management (local to navigation provider)
interface ExtendedNavigationState {
  openSections: string[]
}

const initialExtendedState: ExtendedNavigationState = {
  openSections: NAVIGATION_CONFIG.sections
    .filter(section => section.defaultOpen)
    .map(section => section.id),
}

interface NavigationContextType {
  // Redux state
  isCollapsed: boolean
  activeItem: string
  isMobileOpen: boolean
  isMobile: boolean
  // Local state
  openSections: string[]
  // Actions
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
  const dispatch = useAppDispatch()
  
  // Get navigation state from Redux with comprehensive safety checks
  const navigationState = useAppSelector(state => {
    // Ensure state exists and has navigation property
    if (!state || typeof state !== 'object' || !('navigation' in state)) {
      console.warn('Navigation state not found in Redux store, using defaults');
      return null;
    }
    return state.navigation;
  });
  
  // Extract values with safe defaults
  const sidebarCollapsed = navigationState?.sidebarCollapsed ?? false;
  const activeRoute = navigationState?.activeRoute ?? '/dashboard';
  const mobileNavOpen = navigationState?.mobileNavOpen ?? false;
  const isMobile = navigationState?.isMobile ?? false;
  
  // Local state for sections
  const [openSections, setOpenSections] = React.useState(initialExtendedState.openSections)

  const toggleSidebar = useCallback(() => {
    dispatch(toggleSidebarAction())
  }, [dispatch])

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    dispatch(setSidebarCollapsedAction(collapsed))
  }, [dispatch])

  const setActiveItem = useCallback((item: string) => {
    dispatch(setActiveRoute(item))
  }, [dispatch])

  const toggleSection = useCallback((sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }, [])

  const toggleMobileNav = useCallback(() => {
    dispatch(toggleMobileNavAction())
  }, [dispatch])

  const setMobileNavOpen = useCallback((open: boolean) => {
    dispatch(setMobileNavOpenAction(open))
  }, [dispatch])

  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 1024 // lg breakpoint
      const isTabletView = window.innerWidth >= 768 && window.innerWidth < 1024 // md to lg
      
      dispatch(setIsMobile(isMobileView))
      
      // Close mobile nav on desktop
      if (!isMobileView && mobileNavOpen) {
        dispatch(setMobileNavOpenAction(false))
      }
      
      // Auto-collapse sidebar on tablet for better space utilization
      if (isTabletView && !sidebarCollapsed) {
        dispatch(setSidebarCollapsedAction(true))
      }
    }

    // Enhanced debounced resize handler
    let timeoutId: NodeJS.Timeout
    const debouncedResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleResize, 150)
    }

    window.addEventListener('resize', debouncedResize)
    
    // Initial check
    handleResize()
    
    return () => {
      window.removeEventListener('resize', debouncedResize)
      clearTimeout(timeoutId)
    }
  }, [dispatch, mobileNavOpen, sidebarCollapsed])

  const value: NavigationContextType = useMemo(() => ({
    // Redux state
    isCollapsed: sidebarCollapsed,
    activeItem: activeRoute,
    isMobileOpen: mobileNavOpen,
    isMobile,
    // Local state
    openSections,
    // Actions
    toggleSidebar,
    setSidebarCollapsed,
    setActiveItem,
    toggleSection,
    toggleMobileNav,
    setMobileNavOpen
  }), [
    sidebarCollapsed,
    activeRoute,
    mobileNavOpen,
    isMobile,
    openSections,
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

export function useNavigation(): NavigationContextType {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  
  // Add additional safety check for context properties
  if (typeof context.isCollapsed === 'undefined') {
    console.warn('Navigation context isCollapsed is undefined, this might indicate a timing issue');
  }
  
  return context
}
