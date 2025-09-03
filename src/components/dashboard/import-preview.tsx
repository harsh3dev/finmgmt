'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Link, 
  Calendar,
  Upload,
  ExternalLink,
  Clock,
  CheckCircle
} from 'lucide-react'
import { formatRefreshInterval } from '@/lib/utils'
import { DashboardExport } from '@/types/dashboard-config'
import { ApiEndpoint } from '@/types/widget'
import { maskApiKey } from '@/lib/crypto-utils'

interface ImportPreviewProps {
  importData: DashboardExport
  onImport: () => void
  onCancel?: () => void
  isProcessing: boolean
}

type PreviewTab = 'summary' | 'widgets' | 'apis'

export function ImportPreview({ importData, onImport, isProcessing }: ImportPreviewProps) {
  const [activeTab, setActiveTab] = useState<PreviewTab>('summary')

  const { metadata, data } = importData
  const { widgets, apiEndpoints } = data

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getWidgetTypeColor = (displayType?: string) => {
    const colors: Record<string, string> = {
      'card': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'chart': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'table': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'list': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'custom': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
    return colors[displayType || 'custom'] || colors['custom']
  }

  const getApiStatus = (endpoint: ApiEndpoint) => {
    if (endpoint.apiKey) {
      return { 
        status: typeof endpoint.apiKey === 'string' ? maskApiKey(endpoint.apiKey) : 'configured', 
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
      }
    }
    return { status: 'needs setup', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Preview Header */}
      <div className="border-b pb-4 mb-4">
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Exported: {formatDate(importData.exportDate)}</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>Version: {importData.version}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'summary'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Summary
        </button>
        <button
          onClick={() => setActiveTab('widgets')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'widgets'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Widgets ({widgets.length})
        </button>
        <button
          onClick={() => setActiveTab('apis')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'apis'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          APIs ({apiEndpoints.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto max-h-96">
        {activeTab === 'summary' && (
          <div className="space-y-4 overflow-y-auto h-fit">
            {/* Quick Action Header */}
            <div className="p-4 rounded-lg border-2 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <div>
                    <h4 className="font-medium text-green-800 dark:text-green-200">
                      Ready to Import
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {metadata.totalWidgets} widgets and {metadata.totalApiEndpoints} API endpoints found
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={onImport} 
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Now
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Import Info */}
            <div className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-800">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {metadata.exportName}
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Widgets:</span>
                  <span className="font-medium ml-2">{metadata.totalWidgets}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">API Endpoints:</span>
                  <span className="font-medium ml-2">{metadata.totalApiEndpoints}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Export Date:</span>
                  <span className="font-medium ml-2">{formatDate(importData.exportDate)}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">App Version:</span>
                  <span className="font-medium ml-2">{importData.appVersion}</span>
                </div>
              </div>
              {metadata.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                  {metadata.description}
                </p>
              )}
            </div>
            
            {/* Content Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Widgets
                  </h4>
                  <Badge variant="secondary">{widgets.length}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  {widgets.slice(0, 3).map((widget, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="truncate">{widget.name}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getWidgetTypeColor(widget.displayType)}`}
                      >
                        {widget.displayType || 'auto'}
                      </Badge>
                    </div>
                  ))}
                  {widgets.length > 3 && (
                    <div className="text-center">
                      <Button
                        variant="link"
                        onClick={() => setActiveTab('widgets')}
                        className="text-xs text-blue-500 hover:text-blue-700 p-0 h-auto"
                      >
                        View all {widgets.length} widgets →
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Link className="h-4 w-4 text-green-500" />
                    API Endpoints
                  </h4>
                  <Badge variant="secondary">{apiEndpoints.length}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  {apiEndpoints.slice(0, 3).map((api, index) => {
                    const { status, color } = getApiStatus(api)
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <span className="truncate">{api.name}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${color}`}
                        >
                          {status}
                        </Badge>
                      </div>
                    )
                  })}
                  {apiEndpoints.length > 3 && (
                    <div className="text-center">
                      <Button
                        variant="link"
                        onClick={() => setActiveTab('apis')}
                        className="text-xs text-blue-500 hover:text-blue-700 p-0 h-auto"
                      >
                        View all {apiEndpoints.length} APIs →
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'widgets' && (
          <div className="space-y-3">
            {widgets.map((widget, index) => (
              <div key={index} className="p-4 rounded-lg border">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium">{widget.name}</h4>
                  <Badge 
                    variant="outline" 
                    className={getWidgetTypeColor(widget.displayType)}
                  >
                    {widget.displayType || 'auto'}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div className="flex items-center gap-2">
                    <Link className="h-3 w-3" />
                    <span>
                      {widget.apiEndpointId ? 'Uses API endpoint' : 'Direct API URL'}
                    </span>
                  </div>
                  {/* Remove description field as it doesn't exist in Widget type */}
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="h-3 w-3" />
                    <span>Refresh: {formatRefreshInterval(widget.refreshInterval || 300)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'apis' && (
          <div className="space-y-3">
            {apiEndpoints.map((api, index) => {
              const { status, color } = getApiStatus(api)
              return (
                <div key={index} className="p-4 rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{api.name}</h4>
                    <Badge variant="outline" className={color}>
                      {status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-3 w-3" />
                      <span className="font-mono text-xs truncate">{api.url}</span>
                    </div>
                    {api.description && (
                      <p className="text-xs">{api.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs">
                      <span>URL: GET</span>
                      {api.category && <span>Category: {api.category}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
