"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { getFlaggedFeedback, updateModerationStatus, bulkApprove, bulkReject } from "@/app/actions/moderation"
import type { FeedbackEntry } from "@/app/actions/feedback"
import { ArrowLeft, Shield, AlertTriangle, CheckCircle2, XCircle, Loader2, Eye, Brain } from "lucide-react"
import Link from "next/link"

export function ModerationQueue() {
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<FeedbackEntry | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkRejectionReason, setBulkRejectionReason] = useState("")

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getFlaggedFeedback()
      setFeedback(data)
    } catch (error) {
      console.error("[v0] Error loading moderation queue:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleApprove = async (id: string) => {
    setIsUpdating(true)
    try {
      await updateModerationStatus(id, "approved")
      await loadData()
      setSelectedItem(null)
    } catch (error) {
      console.error("[v0] Error approving:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleReject = async (id: string) => {
    setIsUpdating(true)
    try {
      await updateModerationStatus(id, "rejected", rejectionReason)
      setRejectionReason("")
      await loadData()
      setSelectedItem(null)
    } catch (error) {
      console.error("[v0] Error rejecting:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return
    setIsUpdating(true)
    try {
      await bulkApprove(Array.from(selectedIds))
      setSelectedIds(new Set())
      await loadData()
    } catch (error) {
      console.error("[v0] Error bulk approving:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleBulkReject = async () => {
    if (selectedIds.size === 0 || !bulkRejectionReason.trim()) return
    setIsUpdating(true)
    try {
      await bulkReject(Array.from(selectedIds), bulkRejectionReason)
      setSelectedIds(new Set())
      setBulkRejectionReason("")
      await loadData()
    } catch (error) {
      console.error("[v0] Error bulk rejecting:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const selectAll = () => {
    if (selectedIds.size === feedback.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(feedback.map((f) => f.id)))
    }
  }

  const getModerationBadge = (status: string) => {
    switch (status) {
      case "flagged":
        return (
          <Badge className="bg-red-100 text-red-700">
            <AlertTriangle className="w-3 h-3 mr-1" /> Flagged
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-700">
            <Eye className="w-3 h-3 mr-1" /> Pending Review
          </Badge>
        )
      case "approved":
        return (
          <Badge className="bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-slate-100 text-slate-700">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </Badge>
        )
      default:
        return null
    }
  }

  const getSentimentBadge = (sentiment: string | null) => {
    if (!sentiment) return null
    const colors: Record<string, string> = {
      positive: "bg-emerald-100 text-emerald-700",
      negative: "bg-red-100 text-red-700",
      neutral: "bg-slate-100 text-slate-700",
      mixed: "bg-amber-100 text-amber-700",
    }
    return <Badge className={colors[sentiment] || colors.neutral}>{sentiment}</Badge>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-slate-600 hover:text-slate-900">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Shield className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h1 className="font-semibold text-slate-900">Moderation Queue</h1>
                  <p className="text-xs text-slate-500">{feedback.length} items need review</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : selectedItem ? (
          // Detail View
          <div className="max-w-3xl mx-auto space-y-6">
            <Button variant="ghost" onClick={() => setSelectedItem(null)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Queue
            </Button>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedItem.subject}</CardTitle>
                    <CardDescription>Submitted on {new Date(selectedItem.createdAt).toLocaleString()}</CardDescription>
                  </div>
                  {getModerationBadge(selectedItem.moderationStatus)}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Moderation Flags */}
                {selectedItem.moderationFlags.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      Moderation Flags Detected
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.moderationFlags.map((flag) => (
                        <Badge key={flag} className="bg-red-100 text-red-700">
                          {flag.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Analysis */}
                {selectedItem.aiSummary && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-medium text-purple-800 flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4" />
                      AI Analysis
                    </h4>
                    <p className="text-sm text-purple-700 mb-3">{selectedItem.aiSummary}</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.aiCategory && (
                        <Badge className="bg-purple-100 text-purple-700">Category: {selectedItem.aiCategory}</Badge>
                      )}
                      {getSentimentBadge(selectedItem.aiSentiment)}
                      {selectedItem.aiPriority && (
                        <Badge className="bg-purple-100 text-purple-700">Priority: {selectedItem.aiPriority}</Badge>
                      )}
                    </div>
                    {selectedItem.aiKeywords && selectedItem.aiKeywords.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {selectedItem.aiKeywords.map((kw) => (
                          <Badge key={kw} variant="outline" className="text-xs">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Content */}
                <div>
                  <h4 className="text-xs text-slate-500 uppercase mb-2">Description</h4>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-slate-700 whitespace-pre-wrap">{selectedItem.description}</p>
                  </div>
                </div>

                {selectedItem.impact && (
                  <div>
                    <h4 className="text-xs text-slate-500 uppercase mb-2">Impact</h4>
                    <p className="text-slate-700">{selectedItem.impact}</p>
                  </div>
                )}

                {selectedItem.suggestedSolution && (
                  <div>
                    <h4 className="text-xs text-slate-500 uppercase mb-2">Suggested Solution</h4>
                    <p className="text-slate-700">{selectedItem.suggestedSolution}</p>
                  </div>
                )}

                {/* Meta */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{selectedItem.category}</Badge>
                  <Badge variant="outline" className="capitalize">
                    {selectedItem.feedbackType}
                  </Badge>
                  <Badge variant="outline">{selectedItem.urgency} priority</Badge>
                </div>

                {/* Actions */}
                <div className="border-t pt-6 space-y-4">
                  <h4 className="font-medium">Moderation Decision</h4>

                  <div className="flex gap-4">
                    <Button
                      onClick={() => handleApprove(selectedItem.id)}
                      disabled={isUpdating}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2"
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(selectedItem.id)}
                      disabled={isUpdating || !rejectionReason.trim()}
                      className="flex-1 gap-2"
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Reject
                    </Button>
                  </div>

                  <Textarea
                    placeholder="Rejection reason (required for rejection)..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // List View
          <div className="space-y-4">
            {/* Bulk Actions */}
            {feedback.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedIds.size === feedback.length && feedback.length > 0}
                        onCheckedChange={selectAll}
                      />
                      <span className="text-sm text-slate-600">
                        {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
                      </span>
                    </div>
                    {selectedIds.size > 0 && (
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          onClick={handleBulkApprove}
                          disabled={isUpdating}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Approve Selected
                        </Button>
                        <div className="flex items-center gap-2">
                          <Textarea
                            placeholder="Rejection reason..."
                            value={bulkRejectionReason}
                            onChange={(e) => setBulkRejectionReason(e.target.value)}
                            className="h-9 min-h-0 w-48 resize-none py-2"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleBulkReject}
                            disabled={isUpdating || !bulkRejectionReason.trim()}
                          >
                            Reject Selected
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {feedback.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-emerald-500" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">All Caught Up!</h3>
                  <p className="text-slate-600">No items currently require moderation review.</p>
                </CardContent>
              </Card>
            ) : (
              feedback.map((item) => (
                <Card key={item.id} className="hover:border-slate-300 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={() => toggleSelection(item.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedItem(item)}>
                        <div className="flex items-center gap-2 mb-2">
                          {getModerationBadge(item.moderationStatus)}
                          <h3 className="font-medium text-slate-900 truncate">{item.subject}</h3>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2 mb-3">{item.description}</p>

                        {item.moderationFlags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {item.moderationFlags.map((flag) => (
                              <Badge key={flag} variant="outline" className="text-xs text-red-600 border-red-200">
                                {flag.replace(/_/g, " ")}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* AI Summary Preview */}
                        {item.aiSummary && (
                          <div className="flex items-center gap-2 mb-3 text-xs text-purple-600">
                            <Brain className="w-3 h-3" />
                            <span className="truncate">{item.aiSummary}</span>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{item.category}</Badge>
                          <Badge variant="outline" className="capitalize">
                            {item.feedbackType}
                          </Badge>
                          {item.aiSentiment && getSentimentBadge(item.aiSentiment)}
                        </div>
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
