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

const getThemeColors = () => {
  if (typeof window === "undefined") {
    return {
      primary: "#10b981",
      secondary: "#6366f1",
      accent: "#f59e0b",
      destructive: "#ef4444",
      muted: "#6b7280",
      chart1: "#10b981",
      chart2: "#3b82f6",
      chart3: "#f59e0b",
      chart4: "#ef4444",
      chart5: "#8b5cf6",
      chart6: "#ec4899",
    }
  }

  const styles = getComputedStyle(document.documentElement)
  return {
    primary: styles.getPropertyValue("--primary").trim() || "#10b981",
    secondary: styles.getPropertyValue("--secondary").trim() || "#6366f1",
    accent: styles.getPropertyValue("--accent").trim() || "#f59e0b",
    destructive: styles.getPropertyValue("--destructive").trim() || "#ef4444",
    muted: styles.getPropertyValue("--muted").trim() || "#6b7280",
    chart1: "#10b981",
    chart2: "#3b82f6",
    chart3: "#f59e0b",
    chart4: "#ef4444",
    chart5: "#8b5cf6",
    chart6: "#ec4899",
  }
}

// Theme-aware color palette
const CHART_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#10b981",
  neutral: "#6b7280",
  negative: "#ef4444",
  mixed: "#8b5cf6",
}

const STATUS_COLORS: Record<string, string> = {
  received: "#f59e0b",
  "in-progress": "#3b82f6",
  resolved: "#10b981",
}

const URGENCY_COLORS: Record<string, string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
}

export function AnalyticsOverview({ analytics, isLoading, detailed = false }: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-700">Total Feedback</p>
                <p className="text-3xl font-bold text-emerald-900">{analytics.total}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <MessageSquare className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Resolution Rate</p>
                <p className="text-3xl font-bold text-blue-900">{analytics.resolutionRate}%</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CheckCircle2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700">Avg. Rating</p>
                <p className="text-3xl font-bold text-amber-900">{displayRating}/5</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700">Pending Review</p>
                <p className="text-3xl font-bold text-orange-900">
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
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#64748b" fontSize={12} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fill: "#64748b" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No category data available
                </div>
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
                      {analytics.statusBreakdown.map((entry) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={STATUS_COLORS[entry.name as string] || CHART_COLORS[0]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center w-full text-muted-foreground">
                  No status data available
                </div>
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
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {analytics.urgencyBreakdown.map((entry) => (
                          <Cell key={`cell-${entry.name}`} fill={URGENCY_COLORS[entry.name as string] || "#f59e0b"} />
                        ))}
                      </Bar>
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
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {analytics.sentimentBreakdown && analytics.sentimentBreakdown.length > 0 && (
            <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-white">
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
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col justify-center space-y-4">
                    {analytics.sentimentBreakdown.map((s) => (
                      <div
                        key={s.name}
                        className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-100"
                      >
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
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: "#10b981", strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: "#10b981" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
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
                      className="text-sm transition-all hover:scale-105"
                      style={{
                        fontSize: `${Math.max(12, 20 - idx)}px`,
                        opacity: Math.max(0.6, 1 - idx * 0.04),
                        backgroundColor: `${CHART_COLORS[idx % CHART_COLORS.length]}20`,
                        color: CHART_COLORS[idx % CHART_COLORS.length],
                        borderColor: CHART_COLORS[idx % CHART_COLORS.length],
                      }}
                    >
                      {kw.word} ({kw.count})
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No keywords extracted yet</p>
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
                    <div
                      key={question}
                      className="text-center p-4 rounded-lg border"
                      style={{
                        backgroundColor: `${CHART_COLORS[idx % CHART_COLORS.length]}10`,
                        borderColor: `${CHART_COLORS[idx % CHART_COLORS.length]}40`,
                      }}
                    >
                      <div
                        className="text-4xl font-bold mb-2"
                        style={{ color: CHART_COLORS[idx % CHART_COLORS.length] }}
                      >
                        {rating}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{question}</p>
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
                className={
                  u.name === "critical"
                    ? "border-red-200 bg-gradient-to-br from-red-50 to-white"
                    : "border-amber-200 bg-gradient-to-br from-amber-50 to-white"
                }
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

          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
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
