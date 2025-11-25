"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateFeedbackStatus, requestClarification, addAdminNote, type FeedbackEntry } from "@/app/actions/feedback"
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  Loader2,
  AlertTriangle,
  FileText,
  Tag,
  Brain,
  Sparkles,
  TrendingUp,
  ListChecks,
} from "lucide-react"

type Props = {
  feedback: FeedbackEntry
  onBack: () => void
  onUpdate: () => void
}

const URGENCY_COLORS: Record<string, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
}

const STATUS_COLORS: Record<string, string> = {
  received: "bg-blue-100 text-blue-700",
  "in-progress": "bg-amber-100 text-amber-700",
  resolved: "bg-emerald-100 text-emerald-700",
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "bg-emerald-100 text-emerald-700",
  neutral: "bg-slate-100 text-slate-700",
  negative: "bg-red-100 text-red-700",
  mixed: "bg-purple-100 text-purple-700",
}

export function FeedbackDetail({ feedback, onBack, onUpdate }: Props) {
  const [newStatus, setNewStatus] = useState(feedback.status)
  const [clarificationQuestion, setClarificationQuestion] = useState("")
  const [adminNote, setAdminNote] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isSendingClarification, setIsSendingClarification] = useState(false)
  const [isAddingNote, setIsAddingNote] = useState(false)

  const handleStatusUpdate = async () => {
    setIsUpdating(true)
    try {
      await updateFeedbackStatus(feedback.id, newStatus)
      onUpdate()
    } catch (error) {
      console.error("[v0] Error updating status:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSendClarification = async () => {
    if (!clarificationQuestion.trim()) return

    setIsSendingClarification(true)
    try {
      await requestClarification(feedback.id, clarificationQuestion)
      setClarificationQuestion("")
      onUpdate()
    } catch (error) {
      console.error("[v0] Error sending clarification:", error)
    } finally {
      setIsSendingClarification(false)
    }
  }

  const handleAddNote = async () => {
    if (!adminNote.trim()) return

    setIsAddingNote(true)
    try {
      await addAdminNote(feedback.id, adminNote)
      setAdminNote("")
      onUpdate()
    } catch (error) {
      console.error("[v0] Error adding note:", error)
    } finally {
      setIsAddingNote(false)
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
        return <Clock className="w-5 h-5" />
    }
  }

  const displayTags = feedback.tagNames || []
  const hasAiAnalysis = feedback.aiSummary || feedback.aiSentiment || feedback.aiActionItems?.length

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to List
        </Button>
        <div className="flex items-center gap-2">
          {getStatusIcon(feedback.status)}
          <Badge className={STATUS_COLORS[feedback.status]}>{feedback.status}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Feedback Content */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{feedback.subject}</CardTitle>
                  <CardDescription>Submitted on {new Date(feedback.createdAt).toLocaleString()}</CardDescription>
                </div>
                {feedback.moderationStatus === "flagged" && (
                  <Badge className="bg-red-100 text-red-700 gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Flagged for Review
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Meta Info */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="capitalize">
                  {feedback.feedbackType}
                </Badge>
                <Badge variant="outline">{feedback.categoryLabel || feedback.categoryName || "Uncategorized"}</Badge>
                <Badge className={URGENCY_COLORS[feedback.urgency]}>{feedback.urgency} priority</Badge>
                {feedback.aiSentiment && (
                  <Badge className={SENTIMENT_COLORS[feedback.aiSentiment]}>
                    <Sparkles className="w-3 h-3 mr-1" />
                    {feedback.aiSentiment}
                  </Badge>
                )}
              </div>

              {/* AI Summary */}
              {feedback.aiSummary && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg p-4">
                  <Label className="text-xs text-indigo-700 uppercase flex items-center gap-1 mb-2">
                    <Brain className="w-3 h-3" /> AI Summary
                  </Label>
                  <p className="text-slate-700">{feedback.aiSummary}</p>
                </div>
              )}

              {/* Description */}
              <div>
                <Label className="text-xs text-slate-500 uppercase">Description</Label>
                <p className="mt-2 text-slate-700 whitespace-pre-wrap">{feedback.description}</p>
              </div>

              {/* Impact */}
              {feedback.impact && (
                <div>
                  <Label className="text-xs text-slate-500 uppercase">Impact</Label>
                  <p className="mt-2 text-slate-700">{feedback.impact}</p>
                </div>
              )}

              {/* Suggested Solution */}
              {feedback.suggestedSolution && (
                <div>
                  <Label className="text-xs text-slate-500 uppercase">Suggested Solution</Label>
                  <p className="mt-2 text-slate-700">{feedback.suggestedSolution}</p>
                </div>
              )}

              {/* Tags */}
              {displayTags.length > 0 && (
                <div>
                  <Label className="text-xs text-slate-500 uppercase flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Tags
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {displayTags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Keywords */}
              {feedback.keywords && feedback.keywords.length > 0 && (
                <div>
                  <Label className="text-xs text-slate-500 uppercase">Extracted Keywords</Label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {feedback.keywords.map((kw) => (
                      <Badge key={kw} variant="outline" className="text-xs">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Moderation Flags */}
              {feedback.moderationFlags && feedback.moderationFlags.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <Label className="text-xs text-red-700 uppercase flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Moderation Flags
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {feedback.moderationFlags.map((flag) => (
                      <Badge key={flag} className="bg-red-100 text-red-700">
                        {flag.replace("_", " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Analysis Card */}
          {hasAiAnalysis && (
            <Card className="border-indigo-200 bg-gradient-to-br from-white to-indigo-50/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-600" />
                  AI Analysis
                </CardTitle>
                <CardDescription>Automatically generated insights and recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* AI Suggestions vs User Selection */}
                {(feedback.aiCategorySuggestion || feedback.aiUrgencySuggestion) && (
                  <div className="grid grid-cols-2 gap-4">
                    {feedback.aiCategorySuggestion && feedback.aiCategorySuggestion !== feedback.categoryName && (
                      <div className="p-3 bg-white rounded-lg border">
                        <Label className="text-xs text-slate-500">AI Suggested Category</Label>
                        <p className="font-medium text-indigo-600 mt-1">{feedback.aiCategorySuggestion}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          User selected: {feedback.categoryLabel || feedback.categoryName}
                        </p>
                      </div>
                    )}
                    {feedback.aiUrgencySuggestion && feedback.aiUrgencySuggestion !== feedback.urgency && (
                      <div className="p-3 bg-white rounded-lg border">
                        <Label className="text-xs text-slate-500">AI Suggested Urgency</Label>
                        <Badge className={URGENCY_COLORS[feedback.aiUrgencySuggestion]}>
                          {feedback.aiUrgencySuggestion}
                        </Badge>
                        <p className="text-xs text-slate-400 mt-1">User selected: {feedback.urgency}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Items */}
                {feedback.aiActionItems && feedback.aiActionItems.length > 0 && (
                  <div>
                    <Label className="text-xs text-slate-500 uppercase flex items-center gap-1 mb-2">
                      <ListChecks className="w-3 h-3" /> Suggested Action Items
                    </Label>
                    <ul className="space-y-2">
                      {feedback.aiActionItems.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 p-2 bg-white rounded border">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-sm text-slate-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Clarifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Anonymous Follow-up
              </CardTitle>
              <CardDescription>
                {feedback.allowFollowUp
                  ? "Request clarification without revealing the sender's identity"
                  : "The submitter chose not to allow follow-ups"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {feedback.clarifications.length > 0 && (
                <div className="space-y-4 mb-6">
                  {feedback.clarifications.map((clarification) => (
                    <div key={clarification.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-100 rounded-full">
                          <MessageSquare className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{clarification.question}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Asked on {new Date(clarification.createdAt).toLocaleString()}
                          </p>

                          {clarification.response ? (
                            <div className="mt-3 bg-emerald-50 rounded-lg p-3">
                              <p className="text-xs text-emerald-700 font-medium mb-1">Response:</p>
                              <p className="text-slate-700">{clarification.response}</p>
                              {clarification.respondedAt && (
                                <p className="text-xs text-slate-500 mt-2">
                                  Responded on {new Date(clarification.respondedAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                          ) : (
                            <Badge variant="secondary" className="mt-2">
                              Awaiting response
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {feedback.allowFollowUp && (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Ask a follow-up question..."
                    value={clarificationQuestion}
                    onChange={(e) => setClarificationQuestion(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={handleSendClarification}
                    disabled={isSendingClarification || !clarificationQuestion.trim()}
                    className="gap-2"
                  >
                    {isSendingClarification ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Send Question
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Update */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as FeedbackEntry["status"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleStatusUpdate}
                disabled={isUpdating || newStatus === feedback.status}
                className="w-full"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Update Status
              </Button>
            </CardContent>
          </Card>

          {/* Admin Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Internal Notes
              </CardTitle>
              <CardDescription>Private notes visible only to admins</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {feedback.adminNotes && feedback.adminNotes.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {feedback.adminNotes.map((note, idx) => (
                    <div key={idx} className="text-sm bg-slate-50 rounded p-2">
                      {note}
                    </div>
                  ))}
                </div>
              )}
              <Separator />
              <Textarea
                placeholder="Add a note..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={2}
              />
              <Button
                variant="outline"
                onClick={handleAddNote}
                disabled={isAddingNote || !adminNote.trim()}
                className="w-full gap-2 bg-transparent"
              >
                {isAddingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Add Note
              </Button>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
                  <div>
                    <p className="text-sm font-medium">Submitted</p>
                    <p className="text-xs text-slate-500">{new Date(feedback.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {feedback.updatedAt && feedback.updatedAt !== feedback.createdAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                    <div>
                      <p className="text-sm font-medium">Last Updated</p>
                      <p className="text-xs text-slate-500">{new Date(feedback.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {feedback.resolvedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
                    <div>
                      <p className="text-sm font-medium">Resolved</p>
                      <p className="text-xs text-slate-500">{new Date(feedback.resolvedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Moderation Score */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Moderation Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Content Quality</span>
                <span className="text-lg font-bold">{feedback.moderationScore || 100}/100</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    (feedback.moderationScore || 100) >= 70
                      ? "bg-emerald-500"
                      : (feedback.moderationScore || 100) >= 50
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${feedback.moderationScore || 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
