'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Download, FileText, Link, Settings, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { exportDashboard, generateExportFilename } from '@/lib/dashboard-export'
import { Widget, ApiEndpoint } from '@/types/widget'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  widgets: Widget[]
  apiEndpoints: ApiEndpoint[]
}

export function ExportModal({ isOpen, onClose, widgets, apiEndpoints }: ExportModalProps) {
  const [exportName, setExportName] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [exportStep, setExportStep] = useState<'prepare' | 'exporting' | 'success' | 'error'>('prepare')
  const [error, setError] = useState<string | null>(null)

  const userWidgets = widgets.filter(w => !w.isImported)
  const userApis = apiEndpoints.filter(a => !a.isImported)
  
  const filename = generateExportFilename(exportName)

  const handleExport = async () => {
    if (userWidgets.length === 0 && userApis.length === 0) {
      setError('Cannot export empty dashboard. Please add some widgets or API endpoints first.')
      setExportStep('error')
      return
    }

    setIsExporting(true)
    setExportStep('exporting')
    setError(null)

    try {
      const exportData = await exportDashboard(
        userWidgets, 
        userApis, 
        undefined, 
        { exportName: exportName.trim() || 'My Finance Dashboard' }
      )
      
      // Download the file
      const jsonString = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      setExportStep('success')
      
      // Auto-close modal after success
      setTimeout(() => {
        onClose()
        resetModal()
      }, 2000)
    } catch (err) {
      console.error('Export failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to export dashboard')
      setExportStep('error')
    } finally {
      setIsExporting(false)
    }
  }

  const resetModal = () => {
    setExportName('')
    setExportStep('prepare')
    setError(null)
    setIsExporting(false)
  }

  const handleClose = () => {
    if (!isExporting) {
      onClose()
      resetModal()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Dashboard
          </DialogTitle>
          <DialogDescription>
            Export your entire dashboard configuration including widgets, API endpoints, and settings.
          </DialogDescription>
        </DialogHeader>

        {exportStep === 'prepare' && (
          <div className="space-y-6">
            {/* Export Summary */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">Export Summary</h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Widgets</span>
                  </div>
                  <span className="font-medium text-sm">{userWidgets.length} will be exported</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <Link className="h-4 w-4 text-green-500" />
                    <span className="text-sm">API Endpoints</span>
                  </div>
                  <span className="font-medium text-sm">{userApis.length} will be exported</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Dashboard Settings</span>
                  </div>
                  <span className="font-medium text-sm">will be exported</span>
                </div>
              </div>
            </div>

            {/* Export Name */}
            <div className="space-y-2">
              <Label htmlFor="export-name">Export Name (optional)</Label>
              <Input
                id="export-name"
                placeholder="My Finance Dashboard"
                value={exportName}
                onChange={(e) => setExportName(e.target.value)}
                maxLength={50}
              />
            </div>

            {/* Filename Preview */}
            <div className="space-y-2">
              <Label>Generated Filename</Label>
              <div className="p-2 rounded border bg-gray-50 dark:bg-gray-800 text-sm font-mono">
                {filename}
              </div>
            </div>

            {/* API Keys Notice */}
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    API keys and sensitive data will be included
                  </p>
                  <p className="text-amber-700 dark:text-amber-300 mt-1">
                    Only share exported files with trusted sources
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleExport}
                disabled={isExporting || (userWidgets.length === 0 && userApis.length === 0)}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Dashboard
              </Button>
            </div>
          </div>
        )}

        {exportStep === 'exporting' && (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500 mb-4" />
              <h4 className="font-medium text-lg mb-2">Preparing Export...</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Gathering dashboard data and generating export file
              </p>
            </div>
          </div>
        )}

        {exportStep === 'success' && (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h4 className="font-medium text-lg mb-2">Dashboard Exported Successfully!</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your dashboard has been downloaded as <span className="font-mono">{filename}</span>
              </p>
            </div>
          </div>
        )}

        {exportStep === 'error' && (
          <div className="space-y-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h4 className="font-medium text-lg mb-2">Export Failed</h4>
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                {error}
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={() => setExportStep('prepare')}>
                Try Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
