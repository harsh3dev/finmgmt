import {
  LayoutDashboard,
  Grid3X3,
  Database,
  FileInput,
  Key,
  FolderOpen,
  BarChart3,
  Settings,
  Home,
  Shield,
  FileText,
  Sparkles
} from 'lucide-react'
import { NavigationConfig } from '@/types/navigation'

export const NAVIGATION_CONFIG: NavigationConfig = {
  sections: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      items: [
        {
          id: 'overview',
          label: 'Overview',
          href: '/dashboard',
          icon: Home,
          description: 'Dashboard overview and analytics'
        },
        {
          id: 'widgets',
          label: 'Widgets',
          href: '/dashboard/widgets',
          icon: Grid3X3,
          description: 'Manage and configure widgets'
        }
        ,
        {
          id: 'live-trades',
          label: 'Live Trades',
          href: '/dashboard/live',
          icon: BarChart3,
          description: 'Real-time trade stream (MVP)'
        }
      ],
      defaultOpen: true
    },
    {
      id: 'data-management',
      label: 'Data Management',
      items: [
        {
          id: 'apis',
          label: 'APIs',
          href: '/dashboard/apis',
          icon: Database,
          description: 'Manage API endpoints and connections'
        },
        {
          id: 'imported-content',
          label: 'Imported Content',
          href: '/dashboard/imported',
          icon: FileInput,
          description: 'View and manage imported data'
        }
      ],
      defaultOpen: true
    },
    {
      id: 'security',
      label: 'Security',
      items: [
        {
          id: 'api-key-manager',
          label: 'API Key Manager',
          href: '/dashboard/api-keys',
          icon: Key,
          description: 'Securely manage API keys'
        }
      ],
      defaultOpen: false
    },
    {
      id: 'templates',
      label: 'Templates',
      items: [
        {
          id: 'template-gallery',
          label: 'Browse Templates',
          href: '/dashboard/templates',
          icon: FileText,
          description: 'Explore and apply dashboard templates'
        }
      ],
      defaultOpen: false
    }
  ]
}

// Route definitions for easy access
export const ROUTES = {
  DASHBOARD: '/dashboard',
  WIDGETS: '/dashboard/widgets',
  APIS: '/dashboard/apis',
  IMPORTED: '/dashboard/imported',
  API_KEYS: '/dashboard/api-keys',
  TEMPLATES: '/dashboard/templates',
  LIVE: '/dashboard/live'
} as const

// Navigation icons mapping for dynamic rendering
export const NAVIGATION_ICONS = {
  LayoutDashboard,
  Grid3X3,
  Database,
  FileInput,
  Key,
  FolderOpen,
  BarChart3,
  Settings,
  Home,
  Shield,
  FileText,
  Sparkles
} as const

// Responsive breakpoints
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280
} as const

// Sidebar configuration
export const SIDEBAR_CONFIG = {
  width: {
    expanded: 280,
    collapsed: 64
  },
  animation: {
    duration: 200,
    easing: 'ease-in-out'
  }
} as const
