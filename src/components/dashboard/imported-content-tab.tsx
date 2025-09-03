'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ImportedSubTab, Widget, ApiEndpoint } from '@/types/widget'
import { BentoGrid } from './bento-grid'
import { ApiEndpointList } from './api-endpoint-list'
import { Calendar, FileText, Link, Trash2, Download, Search } from 'lucide-react'

interface ImportedContentTabProps {
  importedWidgets: Widget[]
  importedApiEndpoints: ApiEndpoint[]
  allApiEndpoints: ApiEndpoint[]
  onConfigureWidget: (widget: Widget) => void
  onDeleteWidget: (widgetId: string) => void
  onDeleteApi: (apiId: string) => void
  onUpdateWidgetOrder: (widgets: Widget[]) => void
  onBulkExportImportSession?: (importId: string) => void
  onDeleteImportSession?: (importId: string) => void
  onPromoteImportedWidget?: (widget: Widget) => void
}

export function ImportedContentTab({
  importedWidgets,
  importedApiEndpoints,
  allApiEndpoints,
  onConfigureWidget,
  onDeleteWidget,
  onDeleteApi,
  onUpdateWidgetOrder,
  onBulkExportImportSession = () => {},
  onDeleteImportSession = () => {},
  onPromoteImportedWidget
}: ImportedContentTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<ImportedSubTab>('widgets')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set())

  const formatImportDate = (date?: Date) => {
    if (!date) return 'Unknown'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const groupByImportSession = <T extends { importId?: string; importSource?: string; importDate?: Date }>(
    items: T[]
  ) => {
    const groups = new Map<string, { source: string; date: Date; items: T[] }>()
    
    items.forEach(item => {
      const key = item.importId || 'unknown'
      if (!groups.has(key)) {
        groups.set(key, {
          source: item.importSource || 'Unknown Source',
          date: item.importDate || new Date(),
          items: []
        })
      }
      groups.get(key)!.items.push(item)
    })
    
    return Array.from(groups.entries()).map(([id, group]) => ({
      importId: id,
      ...group
    }))
  }

  // Filter items based on search query
  const filterBySearch = <T extends { name: string }>(items: T[]) => {
    if (!searchQuery.trim()) return items
    const query = searchQuery.toLowerCase()
    return items.filter(item => 
      item.name.toLowerCase().includes(query)
    )
  }

  // Selection handlers
  const handleSessionSelect = (sessionId: string, checked: boolean) => {
    const newSelected = new Set(selectedSessions)
    if (checked) {
      newSelected.add(sessionId)
    } else {
      newSelected.delete(sessionId)
    }
    setSelectedSessions(newSelected)
  }

  const handleSelectAllSessions = (sessions: { importId: string }[], checked: boolean) => {
    if (checked) {
      setSelectedSessions(new Set(sessions.map(s => s.importId)))
    } else {
      setSelectedSessions(new Set())
    }
  }

  // Bulk operations
  const handleBulkDeleteSessions = () => {
    selectedSessions.forEach(sessionId => {
      onDeleteImportSession(sessionId)
    })
    setSelectedSessions(new Set())
  }

  const handleBulkExportSessions = () => {
    selectedSessions.forEach(sessionId => {
      onBulkExportImportSession(sessionId)
    })
  }

  const widgetGroups = groupByImportSession(filterBySearch(importedWidgets))
  const apiGroups = groupByImportSession(filterBySearch(importedApiEndpoints))

  return (
    <div className="space-y-6">
      {(importedWidgets.length > 0 || importedApiEndpoints.length > 0) && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search imported content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {(activeSubTab === 'widgets' ? widgetGroups : apiGroups).length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedSessions.size === (activeSubTab === 'widgets' ? widgetGroups : apiGroups).length}
                  onCheckedChange={(checked) => 
                    handleSelectAllSessions(
                      activeSubTab === 'widgets' ? widgetGroups : apiGroups, 
                      checked as boolean
                    )
                  }
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Select all ({selectedSessions.size} selected)
                </span>
              </div>
              
              {selectedSessions.size > 0 && (
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkExportSessions}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Selected
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDeleteSessions}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveSubTab('widgets')}
            className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeSubTab === 'widgets'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <FileText className="h-4 w-4 mr-2" />
            Imported Widgets
            {importedWidgets.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {importedWidgets.length}
              </Badge>
            )}
          </button>
          
          <button
            onClick={() => setActiveSubTab('apis')}
            className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeSubTab === 'apis'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Link className="h-4 w-4 mr-2" />
            Imported APIs
            {importedApiEndpoints.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {importedApiEndpoints.length}
              </Badge>
            )}
          </button>
        </nav>
      </div>

      {activeSubTab === 'widgets' && (
        <div className="space-y-6">
          {widgetGroups.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Imported Widgets
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Import a dashboard to see widgets here
              </p>
            </div>
          ) : (
            widgetGroups.map((group) => (
              <div key={group.importId} className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedSessions.has(group.importId)}
                      onCheckedChange={(checked) => handleSessionSelect(group.importId, checked as boolean)}
                    />
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">
                        {group.source}
                      </h4>
                      <div className="flex items-center gap-1 text-sm text-blue-700 dark:text-blue-300">
                        <Calendar className="h-3 w-3" />
                        <span>Imported {formatImportDate(group.date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-blue-700 dark:text-blue-300">
                      {group.items.length} widgets
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onBulkExportImportSession(group.importId)}
                        title="Export this import session"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteImportSession(group.importId)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete this import session"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <BentoGrid
                  widgets={group.items}
                  apiEndpoints={allApiEndpoints}
                  onConfigureWidget={onConfigureWidget}
                  onRemoveWidget={onDeleteWidget}
                  onUpdateWidgetOrder={onUpdateWidgetOrder}
                  onPromoteImportedWidget={onPromoteImportedWidget}
                />
              </div>
            ))
          )}
        </div>
      )}

      {activeSubTab === 'apis' && (
        <div className="space-y-6">
          {apiGroups.length === 0 ? (
            <div className="text-center py-12">
              <Link className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Imported APIs
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Import a dashboard to see API endpoints here
              </p>
            </div>
          ) : (
            apiGroups.map((group) => (
              <div key={group.importId} className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedSessions.has(group.importId)}
                      onCheckedChange={(checked) => handleSessionSelect(group.importId, checked as boolean)}
                    />
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <Link className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-green-900 dark:text-green-100">
                        {group.source}
                      </h4>
                      <div className="flex items-center gap-1 text-sm text-green-700 dark:text-green-300">
                        <Calendar className="h-3 w-3" />
                        <span>Imported {formatImportDate(group.date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-700 dark:text-green-300">
                      {group.items.length} APIs
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onBulkExportImportSession(group.importId)}
                        title="Export this import session"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteImportSession(group.importId)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete this import session"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <ApiEndpointList
                  apiEndpoints={group.items}
                  onDeleteEndpoint={onDeleteApi}
                />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
