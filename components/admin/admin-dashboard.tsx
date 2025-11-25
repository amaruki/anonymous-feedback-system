"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnalyticsOverview } from "./analytics-overview"
import { FeedbackList } from "./feedback-list"
import { FeedbackDetail } from "./feedback-detail"
import { getAllFeedback, getAnalytics, type FeedbackEntry } from "@/app/actions/feedback"
import { getModerationStats } from "@/app/actions/moderation"
import { LayoutDashboard, MessageSquare, BarChart3 } from "lucide-react"

export function AdminDashboard() {
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([])
  const [analytics, setAnalytics] = useState<Awaited<ReturnType<typeof getAnalytics>> | null>(null)
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackEntry | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [feedbackData, analyticsData] = await Promise.all([
        getAllFeedback(),
        getAnalytics(),
        getModerationStats(),
      ])
      setFeedback(feedbackData)
      setAnalytics(analyticsData)
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

  return (
    <>
      
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
    </>
  )
}
