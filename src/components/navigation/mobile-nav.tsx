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

  return (
    <div className={cn('lg:hidden', className)}>
      <Sheet open={isMobileOpen} onOpenChange={setMobileNavOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 hover:bg-accent hover:text-accent-foreground"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="p-6 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">FM</span>
                </div>
                <span className="font-semibold">Finance Manager</span>
              </SheetTitle>
              <SheetClose asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
          </SheetHeader>
          
          <div className="flex-1 px-6 py-4 overflow-y-auto">
            <nav className="space-y-4">
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
          
          <div className="p-6 border-t">
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

  // Single item section
  if (!hasMultipleItems) {
    return (
      <MobileNavItem
        item={singleItem}
        isActive={activeItem.startsWith(singleItem.href)}
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
            className="w-full justify-between h-10 px-3 hover:bg-accent hover:text-accent-foreground"
          >
            <span className="text-sm font-medium">{section.label}</span>
            <ChevronDown 
              className={cn(
                "h-4 w-4 transition-transform",
                isOpen && "transform rotate-180"
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 ml-4">
          {section.items.map((item) => (
            <MobileNavItem
              key={item.id}
              item={item}
              isActive={activeItem.startsWith(item.href)}
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

  return (
    <Link href={item.href} onClick={onClick}>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'w-full justify-start h-10 px-3 hover:bg-accent hover:text-accent-foreground',
          isActive && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
        )}
      >
        <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
        <div className="flex-1 text-left">
          <div className="text-sm font-medium">{item.label}</div>
          {item.description && (
            <div className="text-xs text-muted-foreground line-clamp-1">
              {item.description}
            </div>
          )}
        </div>
        {item.badge && (
          <span className="ml-2 text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
            {item.badge}
          </span>
        )}
      </Button>
    </Link>
  )
}
