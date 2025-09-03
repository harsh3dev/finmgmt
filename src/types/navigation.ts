import { LucideIcon } from 'lucide-react'

export interface NavigationItem {
  id: string
  label: string
  href: string
  icon: LucideIcon
  description?: string
  badge?: string | number
  isExternal?: boolean
}

export interface NavigationSection {
  id: string
  label: string
  items: NavigationItem[]
  collapsible?: boolean
  defaultOpen?: boolean
}

export interface NavigationConfig {
  sections: NavigationSection[]
}

export interface NavigationState {
  isCollapsed: boolean
  activeItem: string
  openSections: string[]
  isMobileOpen: boolean
}

export type NavigationAction = 
  | { type: 'TOGGLE_COLLAPSE' }
  | { type: 'SET_COLLAPSED'; payload: boolean }
  | { type: 'SET_ACTIVE_ITEM'; payload: string }
  | { type: 'TOGGLE_SECTION'; payload: string }
  | { type: 'SET_MOBILE_OPEN'; payload: boolean }
  | { type: 'TOGGLE_MOBILE' }
