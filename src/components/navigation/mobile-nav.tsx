'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Menu, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetClose
} from '@/components/ui/sheet'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { NAVIGATION_CONFIG } from '@/constants/navigation'
import { NavigationItem, NavigationSection } from '@/types/navigation'
import { useNavigation } from '@/components/providers/navigation-provider'
import { isNavigationItemActive } from '@/lib/navigation-utils'

interface MobileNavProps {
  className?: string
}

export function MobileNav({ className }: MobileNavProps) {
  const { state, toggleSection, setMobileNavOpen } = useNavigation()
  const { isMobileOpen, openSections } = state
  const pathname = usePathname()

  const closeNav = () => {
    setMobileNavOpen(false)
  }

  // Enhanced touch interactions
  const handleTouchStart = () => {
    // Add haptic feedback on supported devices
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }

  return (
    <div className={cn('lg:hidden', className)}>
      <Sheet open={isMobileOpen} onOpenChange={setMobileNavOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring rounded-md transition-all duration-150 active:scale-95"
            onTouchStart={handleTouchStart}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="left" 
          className="w-[85vw] max-w-sm p-0 bg-background/95 backdrop-blur-lg border-border/50"
        >
          <SheetHeader className="p-4 sm:p-6 border-b border-border/50">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-primary-foreground font-bold text-sm">FM</span>
                </div>
                <span className="font-semibold text-foreground">Finance Manager</span>
              </SheetTitle>
              <SheetClose asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-accent hover:text-accent-foreground rounded-md transition-all duration-150 active:scale-95"
                  onTouchStart={handleTouchStart}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close navigation menu</span>
                </Button>
              </SheetClose>
            </div>
          </SheetHeader>
          
          <div className="flex-1 px-4 py-4 sm:px-6 overflow-y-auto overscroll-contain">
            <nav className="space-y-3 sm:space-y-4">
              {NAVIGATION_CONFIG.sections.map((section) => (
                <MobileNavSection
                  key={section.id}
                  section={section}
                  isOpen={openSections.includes(section.id)}
                  onToggle={() => toggleSection(section.id)}
                  activeItem={pathname}
                  onItemClick={closeNav}
                />
              ))}
            </nav>
          </div>
          
          <div className="p-4 sm:p-6 border-t border-border/50 bg-muted/30">
            <div className="text-xs text-muted-foreground">
              Finance Dashboard v1.0
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

interface MobileNavSectionProps {
  section: NavigationSection
  isOpen: boolean
  onToggle: () => void
  activeItem: string
  onItemClick: () => void
}

function MobileNavSection({ 
  section, 
  isOpen, 
  onToggle, 
  activeItem,
  onItemClick
}: MobileNavSectionProps) {
  const hasMultipleItems = section.items.length > 1
  const singleItem = section.items[0]

  // Enhanced touch feedback
  const handleTouchStart = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(5)
    }
  }

  // Single item section
  if (!hasMultipleItems) {
    return (
      <MobileNavItem
        item={singleItem}
        isActive={isNavigationItemActive(activeItem, singleItem.href)}
        onClick={onItemClick}
      />
    )
  }

  // Multiple items section with collapsible
  return (
    <div className="space-y-2">
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between h-11 px-3 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring rounded-md transition-all duration-150 active:scale-[0.98]"
            onTouchStart={handleTouchStart}
          >
            <span className="text-sm font-medium text-foreground">{section.label}</span>
            <ChevronDown 
              className={cn(
                "h-4 w-4 transition-transform duration-200 text-muted-foreground",
                isOpen && "transform rotate-180"
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 ml-3 sm:ml-4 overflow-hidden">
          {section.items.map((item) => (
            <MobileNavItem
              key={item.id}
              item={item}
              isActive={isNavigationItemActive(activeItem, item.href)}
              onClick={onItemClick}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

interface MobileNavItemProps {
  item: NavigationItem
  isActive: boolean
  onClick: () => void
}

function MobileNavItem({ item, isActive, onClick }: MobileNavItemProps) {
  const Icon = item.icon

  // Enhanced touch feedback
  const handleTouchStart = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(5)
    }
  }

  const handleClick = () => {
    handleTouchStart()
    onClick()
  }

  return (
    <Link href={item.href} onClick={handleClick}>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'w-full justify-start h-11 px-3 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring rounded-md transition-all duration-150 active:scale-[0.98]',
          isActive && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-sm'
        )}
        onTouchStart={handleTouchStart}
      >
        <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
        <div className="flex-1 text-left min-w-0">
          <div className="text-sm font-medium truncate">{item.label}</div>
          {item.description && (
            <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {item.description}
            </div>
          )}
        </div>
        {item.badge && (
          <span className="ml-2 text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full flex-shrink-0">
            {item.badge}
          </span>
        )}
      </Button>
    </Link>
  )
}
