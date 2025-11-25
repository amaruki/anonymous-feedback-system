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
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          {branding?.logoUrl ? (
            <img src={branding.logoUrl || "/placeholder.svg"} alt={siteName} className="h-8 w-8 rounded" />
          ) : (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <MessageSquare className="h-4 w-4" />
            </div>
          )}
          <span className="hidden sm:inline-block">{siteName}</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Submit</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/track" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Track</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
