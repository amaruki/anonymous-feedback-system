"use client"

import Link from "next/link"
import { MessageSquare, Search, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SiteHeaderProps {
  branding?: {
    siteName?: string | null
    logoUrl?: string | null
    primaryColor?: string | null
  } | null
}

export function SiteHeader({ branding }: SiteHeaderProps) {
  const siteName = branding?.siteName || "Anonymous Feedback"
  const primaryColor = branding?.primaryColor || "#6366f1"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          {branding?.logoUrl ? (
            <img 
              src={branding.logoUrl} 
              alt={siteName} 
              className="h-8 w-8 rounded object-cover" 
            />
          ) : (
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <MessageSquare className="h-4 w-4" />
            </div>
          )}
          <span className="hidden truncate sm:inline-block">{siteName}</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/track" className="flex items-center gap-1.5">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Track</span>
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}