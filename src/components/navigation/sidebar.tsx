'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { NAVIGATION_CONFIG, SIDEBAR_CONFIG } from '@/constants/navigation'
import { NavigationItem, NavigationSection } from '@/types/navigation'
import { useNavigation } from '@/components/providers/navigation-provider'

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const { state, toggleSidebar, toggleSection, setActiveItem } = useNavigation()
  const { isCollapsed, openSections } = state
  const pathname = usePathname()

  // Update active item when pathname changes
  useEffect(() => {
    setActiveItem(pathname)
  }, [pathname, setActiveItem])

  return (
    <TooltipProvider>
      <div 
        className={cn(
          'relative h-full bg-sidebar border-r border-sidebar-border transition-all duration-200 ease-in-out',
          isCollapsed ? 'w-16' : 'w-70',
          className
        )}
        style={{
          width: isCollapsed ? `${SIDEBAR_CONFIG.width.collapsed}px` : `${SIDEBAR_CONFIG.width.expanded}px`
        }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">FM</span>
              </div>
              <span className="font-semibold text-sidebar-foreground">Finance Manager</span>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={cn(
              'h-8 w-8 p-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              isCollapsed && 'mx-auto'
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto p-2">
          <nav className="space-y-2">
            {isCollapsed ? (
              // Collapsed view - show all items as individual icons with section separators
              <div className="space-y-1">
                {NAVIGATION_CONFIG.sections.map((section, sectionIndex) => (
                  <div key={section.id}>
                    {sectionIndex > 0 && (
                      <div className="my-3 border-t border-sidebar-border"></div>
                    )}
                    {section.items.map((item) => (
                      <SidebarItem
                        key={item.id}
                        item={item}
                        isCollapsed={true}
                        isActive={pathname.startsWith(item.href)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              // Expanded view - show sections with grouping
              <div className="space-y-4">
                {NAVIGATION_CONFIG.sections.map((section) => (
                  <SidebarSection
                    key={section.id}
                    section={section}
                    isOpen={openSections.includes(section.id)}
                    onToggle={() => toggleSection(section.id)}
                    activeItem={pathname}
                  />
                ))}
              </div>
            )}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-sidebar-border">
          {!isCollapsed && (
            <div className="text-xs text-muted-foreground">
              Finance Dashboard v1.0
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

interface SidebarSectionProps {
  section: NavigationSection
  isOpen: boolean
  onToggle: () => void
  activeItem: string
}

function SidebarSection({ 
  section, 
  isOpen, 
  onToggle, 
  activeItem 
}: SidebarSectionProps) {
  const hasMultipleItems = section.items.length > 1
  const singleItem = section.items[0]

  // Single item section - render directly without collapsible wrapper
  if (!hasMultipleItems) {
    return (
      <SidebarItem
        item={singleItem}
        isCollapsed={false}
        isActive={activeItem.startsWith(singleItem.href)}
      />
    )
  }

  // Multiple items section with collapsible header
  return (
    <div className="space-y-1">
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between h-9 px-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <span className="text-sm font-medium text-sidebar-foreground">
              {section.label}
            </span>
            <ChevronDown 
              className={cn(
                "h-4 w-4 transition-transform text-sidebar-foreground",
                isOpen && "transform rotate-180"
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 ml-2">
          {section.items.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              isCollapsed={false}
              isActive={activeItem.startsWith(item.href)}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

interface SidebarItemProps {
  item: NavigationItem
  isCollapsed: boolean
  isActive: boolean
}

function SidebarItem({ item, isCollapsed, isActive }: SidebarItemProps) {
  const Icon = item.icon

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={item.href}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'w-full h-10 p-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive && 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="ml-2">
          <div>
            <p className="font-medium">{item.label}</p>
            {item.description && (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Link href={item.href}>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'w-full justify-start h-9 px-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          isActive && 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'
        )}
      >
        <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
        <span className="text-sm font-medium truncate">{item.label}</span>
        {item.badge && (
          <span className="ml-auto text-xs bg-sidebar-accent text-sidebar-accent-foreground px-2 py-0.5 rounded-full">
            {item.badge}
          </span>
        )}
      </Button>
    </Link>
  )
}
