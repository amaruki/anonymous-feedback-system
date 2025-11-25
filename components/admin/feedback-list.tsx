"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { FeedbackEntry } from "@/app/actions/feedback"
import { getActiveCategories } from "@/app/actions/config"
import type { Category } from "@/lib/db" // Import Category from lib/db instead of lib/db/schema to avoid Drizzle ORM compatibility issues
import { Search, Filter, Clock, CheckCircle2, AlertCircle, MessageSquare, Loader2, Sparkles, Brain } from "lucide-react"

type Props = {
  feedback: FeedbackEntry[]
  isLoading: boolean
  onSelect: (entry: FeedbackEntry) => void
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

const MODERATION_COLORS: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-700",
  flagged: "bg-red-100 text-red-700",
  pending: "bg-slate-100 text-slate-700",
  rejected: "bg-red-100 text-red-700",
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "bg-emerald-100 text-emerald-700",
  neutral: "bg-slate-100 text-slate-700",
  negative: "bg-red-100 text-red-700",
  mixed: "bg-purple-100 text-purple-700",
}

export function FeedbackList({ feedback, isLoading, onSelect }: Props) {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [urgencyFilter, setUrgencyFilter] = useState("all")
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    getActiveCategories().then(setCategories).catch(console.error)
  }, [])

  const filteredFeedback = feedback.filter((f) => {
    const matchesSearch =
      search === "" ||
      f.subject.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase()) 

    const matchesCategory = categoryFilter === "all" || f.categoryName === categoryFilter
    const matchesStatus = statusFilter === "all" || f.status === statusFilter
    const matchesUrgency = urgencyFilter === "all" || f.urgency === urgencyFilter

    return matchesSearch && matchesCategory && matchesStatus && matchesUrgency
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "received":
        return <Clock className="w-4 h-4" />
      case "in-progress":
        return <AlertCircle className="w-4 h-4" />
      case "resolved":
        return <CheckCircle2 className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search feedback..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>

              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Urgency</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle>All Feedback</CardTitle>
          <CardDescription>
            Showing {filteredFeedback.length} of {feedback.length} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredFeedback.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No feedback matching your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFeedback.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => onSelect(entry)}
                  className="w-full text-left p-4 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(entry.status)}
                        <h4 className="font-medium text-slate-900 truncate">{entry.subject}</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={STATUS_COLORS[entry.status]} variant="secondary">
                          {entry.status}
                        </Badge>
                        <Badge className={URGENCY_COLORS[entry.urgency]} variant="secondary">
                          {entry.urgency}
                        </Badge>
                        <Badge variant="outline">{entry.categoryLabel || entry.categoryName || "Uncategorized"}</Badge>
                        <Badge variant="outline" className="capitalize">
                          {entry.feedbackType}
                        </Badge>
                        {entry.moderationStatus === "flagged" && (
                          <Badge className={MODERATION_COLORS.flagged} variant="secondary">
                            Flagged
                          </Badge>
                        )}
                        {entry.clarifications.some((c) => !c.response) && (
                          <Badge className="bg-blue-100 text-blue-700" variant="secondary">
                            Awaiting Response
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-500 whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
