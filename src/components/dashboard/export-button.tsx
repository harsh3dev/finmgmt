'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { ExportModal } from './export-modal'
import { Widget, ApiEndpoint } from '@/types/widget'

interface ExportButtonProps {
  widgets: Widget[]
  apiEndpoints: ApiEndpoint[]
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export function ExportButton({ 
  widgets, 
  apiEndpoints, 
  variant = 'outline',
  size = 'default',
  className 
}: ExportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Keyboard shortcut for export (Ctrl+E)
  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'e') {
        event.preventDefault()
        setIsModalOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyboard)
    return () => document.removeEventListener('keydown', handleKeyboard)
  }, [])

  const userWidgets = widgets.filter(w => !w.isImported)
  const userApis = apiEndpoints.filter(a => !a.isImported)
  const hasContent = userWidgets.length > 0 || userApis.length > 0

  const handleClick = () => {
    setIsModalOpen(true)
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={!hasContent}
        className={className}
        title={hasContent 
          ? `Export dashboard (${userWidgets.length} widgets, ${userApis.length} APIs) - Ctrl+E`
          : 'No content to export. Add some widgets or API endpoints first.'
        }
      >
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>

      <ExportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        widgets={widgets}
        apiEndpoints={apiEndpoints}
      />
    </>
  )
}
