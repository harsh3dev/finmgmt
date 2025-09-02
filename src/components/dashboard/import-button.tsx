'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { ImportModal } from './import-modal'
import { Widget, ApiEndpoint } from '@/types/widget'

interface ImportButtonProps {
  onImportSuccess: (widgets: Widget[], apiEndpoints: ApiEndpoint[]) => void
  onSwitchToImportedTab: () => void
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export function ImportButton({ 
  onImportSuccess,
  onSwitchToImportedTab,
  variant = 'outline',
  size = 'default',
  className 
}: ImportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Keyboard shortcut for import (Ctrl+I)
  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'i') {
        event.preventDefault()
        setIsModalOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyboard)
    return () => document.removeEventListener('keydown', handleKeyboard)
  }, [])

  const handleClick = () => {
    setIsModalOpen(true)
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        className={className}
        title="Import dashboard configuration - Ctrl+I"
      >
        <Upload className="h-4 w-4 mr-2" />
        Import
      </Button>

      <ImportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onImportSuccess={onImportSuccess}
        onSwitchToImportedTab={onSwitchToImportedTab}
      />
    </>
  )
}
