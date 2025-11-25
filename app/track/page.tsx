"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  getFeedbackByAccessCode,
  respondToClarification,
  getBranding,
  type FeedbackEntry,
} from "@/app/actions/feedback"
import { Search, Clock, CheckCircle2, AlertCircle, MessageSquare, Send, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

function TrackingContent() {
  const searchParams = useSearchParams()
  const initialCode = searchParams.get("code") || ""

  const [accessCode, setAccessCode] = useState(initialCode)
  const [feedback, setFeedback] = useState<FeedbackEntry | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [clarificationResponses, setClarificationResponses] = useState<Record<string, string>>({})
  const [submittingClarification, setSubmittingClarification] = useState<string | null>(null)
  const [branding, setBranding] = useState<{
    siteName: string
    logoUrl: string | null
    primaryColor: string
    description: string
  } | null>(null)

  useEffect(() => {
    getBranding().then(setBranding)
    if (initialCode) {
      handleSearch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = async () => {
    if (!accessCode.trim()) return

    setIsLoading(true)
    setError("")

    try {
      const result = await getFeedbackByAccessCode(accessCode.trim())
      if (result) {
        setFeedback(result)
      } else {
        setError("No feedback found with this access code. Please check and try again.")
        setFeedback(null)
      }
    } catch (err) {
      console.error("[v0] Error fetching feedback:", err)
      setError("An error occurred while looking up your feedback.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClarificationResponse = async (clarificationId: string) => {
    const response = clarificationResponses[clarificationId]
    if (!response?.trim()) return

    setSubmittingClarification(clarificationId)
    try {
      await respondToClarification(accessCode, clarificationId, response)
      const updated = await getFeedbackByAccessCode(accessCode)
      if (updated) setFeedback(updated)
      setClarificationResponses((prev) => ({ ...prev, [clarificationId]: "" }))
    } catch (err) {
      console.error("[v0] Error responding to clarification:", err)
    } finally {
      setSubmittingClarification(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "received":
        return <Clock className="w-5 h-5 text-blue-500" />
      case "in-progress":
        return <AlertCircle className="w-5 h-5 text-amber-500" />
      case "resolved":
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
      default:
        return <Clock className="w-5 h-5 text-slate-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "received":
        return "bg-blue-100 text-blue-700"
      case "in-progress":
        return "bg-amber-100 text-amber-700"
      case "resolved":
        return "bg-emerald-100 text-emerald-700"
      default:
        return "bg-slate-100 text-slate-700"
    }
  }

  const primaryColor = branding?.primaryColor || "#10b981"

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link href="/" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Submit Feedback
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Search className="w-6 h-6" style={{ color: primaryColor }} />
              Track Your Feedback
            </CardTitle>
            <CardDescription>
              Enter your anonymous access code to view the status and any follow-up questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 mb-6">
              <div className="flex-1">
                <Label htmlFor="code" className="sr-only">
                  Access Code
                </Label>
                <Input
                  id="code"
                  placeholder="XXXX-XXXX-XXXX"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="font-mono text-center text-lg tracking-wider"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isLoading}
                style={{ backgroundColor: primaryColor }}
                className="hover:opacity-90"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Look Up"}
              </Button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {feedback && (
              <div className="space-y-6">
                {/* Status Timeline */}
                <div className="bg-slate-50 rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    {getStatusIcon(feedback.status)}
                    <div>
                      <Badge className={getStatusColor(feedback.status)}>
                        {feedback.status.replace("-", " ").toUpperCase()}
                      </Badge>
                      <p className="text-sm text-slate-600 mt-1">
                        Submitted on{" "}
                        {new Date(feedback.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Progress Steps */}
                  <div className="flex items-center mt-6">
                    {["received", "in-progress", "resolved"].map((step, idx) => {
                      const isActive = feedback.status === step
                      const isPast = ["received", "in-progress", "resolved"].indexOf(feedback.status) >= idx
                      return (
                        <div key={step} className="flex-1 flex items-center">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                            style={{
                              backgroundColor: isPast ? primaryColor : undefined,
                              color: isPast ? "white" : undefined,
                            }}
                          >
                            {idx + 1}
                          </div>
                          {idx < 2 && (
                            <div
                              className="flex-1 h-1 mx-2"
                              style={{
                                backgroundColor: isPast && !isActive ? primaryColor : "#e2e8f0",
                              }}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-slate-600">
                    <span>Received</span>
                    <span>In Progress</span>
                    <span>Resolved</span>
                  </div>
                </div>

                {/* Feedback Summary */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">{feedback.subject}</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline">{feedback.category}</Badge>
                    <Badge variant="outline" className="capitalize">
                      {feedback.feedbackType}
                    </Badge>
                    <Badge variant="outline">{feedback.urgency} priority</Badge>
                  </div>
                  <p className="text-sm text-slate-600">{feedback.description}</p>
                </div>

                {/* Clarification Requests */}
                {feedback.clarifications.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Clarification Requests
                      </h4>
                      <div className="space-y-4">
                        {feedback.clarifications.map((clarification) => (
                          <div key={clarification.id} className="bg-slate-50 rounded-lg p-4">
                            <p className="text-sm font-medium text-slate-900 mb-2">{clarification.question}</p>
                            <p className="text-xs text-slate-500 mb-3">
                              Asked on {new Date(clarification.createdAt).toLocaleDateString()}
                            </p>

                            {clarification.response ? (
                              <div className="bg-white rounded-lg p-3 border">
                                <p className="text-xs font-medium mb-1" style={{ color: primaryColor }}>
                                  Your Response:
                                </p>
                                <p className="text-sm text-slate-700">{clarification.response}</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <Textarea
                                  placeholder="Write your anonymous response..."
                                  value={clarificationResponses[clarification.id] || ""}
                                  onChange={(e) =>
                                    setClarificationResponses((prev) => ({
                                      ...prev,
                                      [clarification.id]: e.target.value,
                                    }))
                                  }
                                  rows={3}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleClarificationResponse(clarification.id)}
                                  disabled={submittingClarification === clarification.id}
                                  style={{ backgroundColor: primaryColor }}
                                  className="hover:opacity-90"
                                >
                                  {submittingClarification === clarification.id ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <Send className="w-4 h-4 mr-2" />
                                  )}
                                  Send Response
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Resolution Info */}
                {feedback.status === "resolved" && feedback.resolvedAt && (
                  <>
                    <Separator />
                    <div className="rounded-lg p-4" style={{ backgroundColor: `${primaryColor}15` }}>
                      <div className="flex items-center gap-2" style={{ color: primaryColor }}>
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">
                          Resolved on {new Date(feedback.resolvedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </main>
      }
    >
      <TrackingContent />
    </Suspense>
  )
}
