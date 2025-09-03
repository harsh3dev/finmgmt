'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/navigation/sidebar'
import { MobileNav } from '@/components/navigation/mobile-nav'
import { useNavigation } from '@/components/providers/navigation-provider'
import { ThemeToggle } from '@/components/theme-toggle'

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  const { state } = useNavigation()

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div 
        className={cn(
          'transition-all duration-300 ease-in-out',
          'lg:pl-70',
          state.isCollapsed && 'lg:pl-16'
        )}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex h-14 sm:h-16 items-center gap-x-4 border-b bg-background/95 backdrop-blur-lg px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          {/* Mobile Navigation */}
          <MobileNav />

          {/* Header Content */}
          <div className="flex flex-1 items-center justify-between min-w-0">
            <div className="flex items-center space-x-4 min-w-0">
              <h1 className="text-lg font-semibold text-foreground lg:hidden truncate">
                Finance Dashboard
              </h1>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={cn('flex-1', className)}>
          <div className="px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8 xl:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
