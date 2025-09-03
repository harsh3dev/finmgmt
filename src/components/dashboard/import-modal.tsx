'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { validateImportFile, importDashboardContent } from '@/lib/dashboard-import'
import { DashboardExport } from '@/types/dashboard-config'
import { ImportPreview } from '@/components/dashboard/import-preview'
import { Widget, ApiEndpoint } from '@/types/widget'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportSuccess: (widgets: Widget[], apiEndpoints: ApiEndpoint[]) => void
  onSwitchToImportedTab: () => void
}

type ImportStep = 'file-select' | 'file-validation' | 'preview' | 'importing' | 'success' | 'error'

export function ImportModal({ 
  isOpen, 
  onClose, 
  onImportSuccess,
  onSwitchToImportedTab
}: ImportModalProps) {
  const [currentStep, setCurrentStep] = useState<ImportStep>('file-select')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importData, setImportData] = useState<DashboardExport | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importProgress, setImportProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetModal = () => {
    setCurrentStep('file-select')
    setSelectedFile(null)
    setImportData(null)
    setValidationErrors([])
    setIsProcessing(false)
    setError(null)
    setImportProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    if (!isProcessing) {
      onClose()
      resetModal()
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setCurrentStep('file-validation')
    setIsProcessing(true)
    setError(null)

    try {
      // Validate the file
      const validation = await validateImportFile(file)
      
      if (!validation.isValid) {
        setValidationErrors(validation.errors)
        setCurrentStep('error')
        setError('File validation failed')
        return
      }

      setImportData(validation.data!)
      setCurrentStep('preview')
    } catch (err) {
      console.error('File validation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to validate import file')
      setCurrentStep('error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImport = async () => {
    if (!importData || !selectedFile) return

    setCurrentStep('importing')
    setIsProcessing(true)
    setImportProgress(0)

    try {
      setImportProgress(25)
      await new Promise(resolve => setTimeout(resolve, 300))

      setImportProgress(50)
      await new Promise(resolve => setTimeout(resolve, 300))

      setImportProgress(75)
      const result = await importDashboardContent(importData, selectedFile.name)

      setImportProgress(100)
      await new Promise(resolve => setTimeout(resolve, 300))

      onImportSuccess(result.widgets, result.apiEndpoints)
      
      setCurrentStep('success')

      setTimeout(() => {
        onSwitchToImportedTab()
        handleClose()
      }, 2000)

    } catch (err) {
      console.error('Import failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to import dashboard')
      setCurrentStep('error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTryAgain = () => {
    setCurrentStep('file-select')
    setSelectedFile(null)
    setImportData(null)
    setValidationErrors([])
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Dashboard
          </DialogTitle>
          <DialogDescription>
            Import a dashboard configuration from a JSON export file.
          </DialogDescription>
        </DialogHeader>

        {currentStep === 'file-select' && (
          <div className="space-y-6">
            {/* File Upload Area */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Select Dashboard Export File</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Choose a JSON file exported from a Finance Dashboard
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="hidden"
                id="import-file"
              />
              <Button asChild>
                <label htmlFor="import-file" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </label>
              </Button>
            </div>

            {/* Info Box */}
            <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-200">
                    Supported File Format
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    Only JSON files exported from Finance Dashboard are supported. 
                    Imported content will appear in the &ldquo;Imported&rdquo; tab.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'file-validation' && (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500 mb-4" />
              <h4 className="font-medium text-lg mb-2">Validating Import File...</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Checking file format and content
              </p>
            </div>
          </div>
        )}

        {currentStep === 'preview' && importData && (
          <div className="flex-1 overflow-y-auto">
            <ImportPreview 
              importData={importData}
              onImport={handleImport}
              onCancel={handleClose}
              isProcessing={isProcessing}
            />
          </div>
        )}

        {currentStep === 'importing' && (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500 mb-4" />
              <h4 className="font-medium text-lg mb-2">Importing Dashboard...</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {importProgress < 25 && 'Generating new IDs...'}
                {importProgress >= 25 && importProgress < 50 && 'Importing API endpoints...'}
                {importProgress >= 50 && importProgress < 75 && 'Importing widgets...'}
                {importProgress >= 75 && importProgress < 100 && 'Updating dashboard...'}
                {importProgress >= 100 && 'Import completed!'}
              </p>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">{importProgress}% complete</p>
            </div>
          </div>
        )}

        {currentStep === 'success' && (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h4 className="font-medium text-lg mb-2">Dashboard Imported Successfully!</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your imported content is now available in the &ldquo;Imported&rdquo; tab
              </p>
            </div>
          </div>
        )}

        {currentStep === 'error' && (
          <div className="space-y-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h4 className="font-medium text-lg mb-2">Import Failed</h4>
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                {error}
              </p>
              
              {validationErrors.length > 0 && (
                <div className="text-left max-w-md mx-auto">
                  <h5 className="font-medium text-sm mb-2">Validation Errors:</h5>
                  <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                    {validationErrors.map((err, index) => (
                      <li key={index}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={handleTryAgain}>
                Try Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
