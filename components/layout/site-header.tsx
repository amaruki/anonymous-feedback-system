"use client"

import Link from "next/link"
import { MessageSquare, Search, Shield, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"

interface SiteHeaderProps {
  branding?: {
    siteName?: string | null
    logoUrl?: string | null
    primaryColor?: string | null
  } | null
}

export function SiteHeader({ branding }: SiteHeaderProps) {
  const [open, setOpen] = useState(false)
  const siteName = branding?.siteName || "Anonymous Feedback"
  const primaryColor = branding?.primaryColor || "#6366f1"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold min-w-0">
          {branding?.logoUrl ? (
            <img 
              src={branding.logoUrl} 
              alt={siteName} 
              className="h-8 w-8 shrink-0 rounded object-contain" 
            />
          ) : (
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <MessageSquare className="h-4 w-4" />
            </div>
          )}
          <span className="truncate text-sm sm:text-base">{siteName}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/track" className="flex items-center gap-1.5">
              <Search className="h-4 w-4" />
              <span>Track</span>
            </Link>
          </Button>
        </nav>

        {/* Mobile Navigation */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] sm:w-[320px]">
            <nav className="flex flex-col gap-4 mt-8">
              <Link 
                href="/track" 
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
                onClick={() => setOpen(false)}
              >
                <Search className="h-5 w-5" />
                <span className="text-base font-medium">Track Feedback</span>
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}