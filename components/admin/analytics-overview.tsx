"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { getAnalytics } from "@/app/actions/feedback"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts"
import { MessageSquare, TrendingUp, CheckCircle2, Clock, AlertTriangle, Loader2, Brain, Sparkles } from "lucide-react"

type Analytics = Awaited<ReturnType<typeof getAnalytics>>

type Props = {
  analytics: Analytics | null
  isLoading: boolean
  detailed?: boolean
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#10b981",
  neutral: "#6b7280",
  negative: "#ef4444",
  mixed: "#8b5cf6",
}

export function AnalyticsOverview({ analytics, isLoading, detailed = false }: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!analytics) return null

  const firstRatingKey = Object.keys(analytics.averageRatings)[0]
  const displayRating = firstRatingKey ? analytics.averageRatings[firstRatingKey] : "0"

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Feedback</p>
                <p className="text-3xl font-bold text-slate-900">{analytics.total}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <MessageSquare className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Resolution Rate</p>
                <p className="text-3xl font-bold text-slate-900">{analytics.resolutionRate}%</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CheckCircle2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Avg. Rating</p>
                <p className="text-3xl font-bold text-slate-900">{displayRating}/5</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Pending Review</p>
                <p className="text-3xl font-bold text-slate-900">
                  {analytics.statusBreakdown.find((s) => s.name === "received")?.value || 0}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Feedback by Category</CardTitle>
            <CardDescription>Distribution across different feedback categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {analytics.categoryBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.categoryBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">No category data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Overview</CardTitle>
            <CardDescription>Current status of all feedback items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center">
              {analytics.statusBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.statusBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {analytics.statusBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center w-full text-slate-400">No status data available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      {detailed && (
        <>
          {/* Urgency & Type Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Urgency Levels</CardTitle>
                <CardDescription>Distribution of feedback by urgency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.urgencyBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Feedback Types</CardTitle>
                <CardDescription>Suggestions, concerns, praise, and questions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.typeBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {analytics.typeBreakdown.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {analytics.sentimentBreakdown && analytics.sentimentBreakdown.length > 0 && (
            <Card className="border-indigo-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-600" />
                  AI Sentiment Analysis
                </CardTitle>
                <CardDescription>Automatically detected sentiment from feedback content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.sentimentBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {analytics.sentimentBreakdown.map((entry) => (
                            <Cell
                              key={`cell-${entry.name}`}
                              fill={SENTIMENT_COLORS[entry.name as string] || "#6b7280"}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col justify-center space-y-4">
                    {analytics.sentimentBreakdown.map((s) => (
                      <div key={s.name} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: SENTIMENT_COLORS[s.name as string] || "#6b7280" }}
                          />
                          <span className="font-medium capitalize">{s.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{Number(s.value)}</span>
                          <Sparkles className="w-4 h-4 text-indigo-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submission Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Submission Trend</CardTitle>
              <CardDescription>Daily feedback submissions over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {analytics.dailyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: "#10b981" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    No trend data available yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Keywords */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Keywords</CardTitle>
              <CardDescription>Most frequently mentioned terms in feedback</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.topKeywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {analytics.topKeywords.map((kw, idx) => (
                    <Badge
                      key={kw.word}
                      variant="secondary"
                      className="text-sm"
                      style={{
                        fontSize: `${Math.max(12, 20 - idx)}px`,
                        opacity: Math.max(0.5, 1 - idx * 0.04),
                      }}
                    >
                      {kw.word} ({kw.count})
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8">No keywords extracted yet</p>
              )}
            </CardContent>
          </Card>

          {/* Rating Breakdown */}
          {Object.keys(analytics.averageRatings).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Average Ratings</CardTitle>
                <CardDescription>Response ratings from custom questions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(analytics.averageRatings).map(([question, rating], idx) => (
                    <div key={question} className="text-center p-4 bg-slate-50 rounded-lg">
                      <div
                        className={`text-4xl font-bold mb-2 ${
                          idx === 0 ? "text-emerald-600" : idx === 1 ? "text-blue-600" : "text-amber-600"
                        }`}
                      >
                        {rating}
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">{question}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Quick Alerts */}
      {!detailed && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {analytics.urgencyBreakdown
            .filter((u) => u.name === "critical" || u.name === "high")
            .map((u) => (
              <Card
                key={u.name}
                className={u.name === "critical" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`w-5 h-5 ${u.name === "critical" ? "text-red-600" : "text-amber-600"}`} />
                    <div>
                      <p className="font-medium capitalize">{u.name} Priority Items</p>
                      <p className="text-2xl font-bold">{Number(u.value)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="font-medium">Resolved</p>
                  <p className="text-2xl font-bold">
                    {analytics.statusBreakdown.find((s) => s.name === "resolved")?.value || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
