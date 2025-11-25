"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AnalyticsOverview } from "./analytics-overview"
import { FeedbackList } from "./feedback-list"
import { FeedbackDetail } from "./feedback-detail"
import { getAllFeedback, getAnalytics, type FeedbackEntry } from "@/app/actions/feedback"
import { getModerationStats } from "@/app/actions/moderation"
import { LayoutDashboard, MessageSquare, BarChart3, Shield, AlertTriangle, Settings } from "lucide-react"
import Link from "next/link"

export function AdminDashboard() {
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([])
  const [analytics, setAnalytics] = useState<Awaited<ReturnType<typeof getAnalytics>> | null>(null)
  const [moderationStats, setModerationStats] = useState<Awaited<ReturnType<typeof getModerationStats>> | null>(null)
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackEntry | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [feedbackData, analyticsData, modStats] = await Promise.all([
        getAllFeedback(),
        getAnalytics(),
        getModerationStats(),
      ])
      setFeedback(feedbackData)
      setAnalytics(analyticsData)
      setModerationStats(modStats)
    } catch (error) {
      console.error("[v0] Error loading admin data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleFeedbackSelect = (entry: FeedbackEntry) => {
    setSelectedFeedback(entry)
  }

  const handleFeedbackUpdate = () => {
    loadData()
    setSelectedFeedback(null)
  }

  const needsModeration = (moderationStats?.flagged || 0) + (moderationStats?.pending || 0)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Shield className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h1 className="font-semibold text-slate-900">Feedback Admin</h1>
                <p className="text-xs text-slate-500">Anonymous feedback management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {needsModeration > 0 && (
                <Link href="/admin/moderation">
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Moderation Queue
                    <Badge className="bg-amber-100 text-amber-700">{needsModeration}</Badge>
                  </Button>
                </Link>
              )}
              <Link href="/admin/settings">
                <Button variant="ghost" size="icon">
                  <Settings className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                View Submission Portal
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {selectedFeedback ? (
          <FeedbackDetail
            feedback={selectedFeedback}
            onBack={() => setSelectedFeedback(null)}
            onUpdate={handleFeedbackUpdate}
          />
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-white border">
              <TabsTrigger value="overview" className="gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="feedback" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Feedback ({feedback.length})
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <AnalyticsOverview analytics={analytics} isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="feedback">
              <FeedbackList feedback={feedback} isLoading={isLoading} onSelect={handleFeedbackSelect} />
            </TabsContent>

            <TabsContent value="analytics">
              <AnalyticsOverview analytics={analytics} isLoading={isLoading} detailed />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}
