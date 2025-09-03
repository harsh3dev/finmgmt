"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  // Enhanced touch interaction
  const handleTouchStart = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(5)
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      onTouchStart={handleTouchStart}
      className="relative h-9 w-9 sm:h-10 sm:w-10 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring transition-all duration-150 active:scale-95 no-tap-zoom"
    >
      <Sun className="h-[1.1rem] w-[1.1rem] sm:h-[1.2rem] sm:w-[1.2rem] rotate-0 scale-100 transition-all duration-200 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.1rem] w-[1.1rem] sm:h-[1.2rem] sm:w-[1.2rem] rotate-90 scale-0 transition-all duration-200 dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
