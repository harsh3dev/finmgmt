'use client'

import { Badge } from '@/components/ui/badge'
import { DashboardTab } from '@/types/widget'

interface DashboardTabsProps {
  activeTab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
  widgetCount: number
  apiCount: number
  importedWidgetCount: number
  importedApiCount: number
}

export function DashboardTabs({
  activeTab,
  onTabChange,
  widgetCount,
  apiCount,
  importedWidgetCount,
  importedApiCount
}: DashboardTabsProps) {
  const tabs = [
    {
      id: 'widgets' as DashboardTab,
      label: 'Widgets',
      count: widgetCount,
      description: 'Your custom widgets'
    },
    {
      id: 'apis' as DashboardTab,
      label: 'APIs',
      count: apiCount,
      description: 'API endpoint configurations'
    },
    {
      id: 'imported' as DashboardTab,
      label: 'Imported',
      count: importedWidgetCount + importedApiCount,
      description: 'Imported dashboard content'
    }
  ]

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <nav className="-mb-px flex space-x-8" aria-label="Dashboard tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                isActive
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span>{tab.label}</span>
              
              {/* Tab Count Badge */}
              {tab.count > 0 && (
                <Badge 
                  variant={isActive ? 'default' : 'secondary'}
                  className={`ml-2 ${
                    isActive 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                      : ''
                  }`}
                >
                  {tab.count}
                </Badge>
              )}

              {/* Tooltip on hover */}
              <span className="sr-only">{tab.description}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
