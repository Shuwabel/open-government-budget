"use client"

import { useEffect } from "react"
import { ThemeProvider } from "next-themes"
import { bootStore } from "@/lib/store"

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void bootStore()
  }, [])
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  )
}
