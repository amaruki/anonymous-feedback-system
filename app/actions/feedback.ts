"use server"

import { db } from "@/lib/db"
import type { Feedback, Tag } from "@/lib/db"
import { generateAccessCode, hashAccessCode, moderateContent, extractKeywords } from "@/lib/feedback-utils"
import { sendNotification } from "@/lib/notifications"
import { analyzeFeedback } from "@/lib/ai-categorization"

export type FeedbackData = {
  category: string
  urgency: string
  tags: string[]
  feedbackType: string
  subject: string
  description: string
  impact: string
  suggestedSolution: string
  allowFollowUp: boolean
  questionResponses?: Record<string, { type: string; value: string | number }>
  reporterNotificationType?: string
  reporterNotificationContact?: string
}

export type FeedbackEntry = {
  id: string
  accessCodeHash: string
  categoryId: string | null
  feedbackType: "suggestion" | "concern" | "praise" | "question"
  urgency: "low" | "medium" | "high" | "critical"
  subject: string
  description: string
  impact: string | null
  suggestedSolution: string | null
  allowFollowUp: boolean | null
  rating: number | null
  status: "received" | "in-progress" | "resolved"
  moderationStatus: "pending" | "approved" | "flagged" | "rejected"
  moderationFlags: string[]
  moderationScore: number | null
  keywords: string[]
  aiCategory: string | null
  aiSentiment: "positive" | "neutral" | "negative" | "mixed" | null
  aiPriority: "low" | "medium" | "high" | "critical" | null
  aiSummary: string | null
  aiKeywords: string[] | null
  aiCategorySuggestion: string | null
  aiUrgencySuggestion: string | null
  aiActionItems: string[] | null
  adminNotes: string[]
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
  category: string
  categoryName?: string
  categoryLabel?: string
  tags: string[]
  tagNames?: string[]
  clarifications: Array<{
    id: string
    question: string
    response: string | null
    createdAt: string
    respondedAt: string | null
  }>
  responses?: Array<{
    questionId: string
    questionText: string
    responseValue?: string | null
    responseNumber?: number | null
  }>
}

export async function submitFeedback(data: FeedbackData): Promise<{ accessCode: string; id: string }> {
  const accessCode = generateAccessCode()
  const accessCodeHash = await hashAccessCode(accessCode)

  const moderation = await moderateContent(data.description + " " + data.subject)
  const keywords = extractKeywords(data.description + " " + data.subject)

  // Find category
  const allCategories = await db.categories.getActive()
  const matchedCategory = allCategories.find((c) => c.name === data.category)
  const categoryId = matchedCategory?.id || null

  // Get active tags
  const allTags = await db.tags.getActive()

  // AI analysis
  let aiAnalysis = null
  try {
    aiAnalysis = await analyzeFeedback(
      data.subject,
      data.description,
      data.impact,
      data.suggestedSolution,
      allCategories.map((c) => c.name),
      allTags.map((t) => t.name),
    )
  } catch (error) {
    console.error("[v0] AI analysis failed:", error)
  }

  // Get tag IDs
  const allSelectedTags = [...new Set([...data.tags, ...(aiAnalysis?.suggestedTags || [])])]
  const tagIds = allTags.filter((t) => allSelectedTags.includes(t.name)).map((t) => t.id)

  // Create feedback
  const entry = await db.feedback.create({
    accessCodeHash,
    categoryId,
    feedbackType: data.feedbackType,
    urgency: data.urgency,
    subject: data.subject,
    description: data.description,
    impact: data.impact || null,
    suggestedSolution: data.suggestedSolution || null,
    status: "received",
    moderationStatus: moderation.passed ? "approved" : "flagged",
    reporterNotificationType: data.reporterNotificationType as Feedback["reporterNotificationType"],
    reporterNotificationContact: data.reporterNotificationContact,
  })

  // Insert feedback tags
  for (const tagId of tagIds) {
    await db.feedbackTags.create({ feedbackId: entry.id, tagId })
  }

  // Insert question responses
  if (data.questionResponses) {
    const activeQuestions = await db.questions.getActive()
    for (const [questionId, response] of Object.entries(data.questionResponses)) {
      const question = activeQuestions.find((q) => q.id === questionId)
      if (question) {
        await db.feedbackResponses.create({
          feedbackId: entry.id,
          questionId,
          responseValue: String(response.value),
        })
      }
    }
  }

  // Send notification
  try {
    await sendNotification("new_feedback", {
      id: entry.id,
      subject: data.subject,
      urgency: data.urgency,
      category: matchedCategory?.label || data.category,
      feedbackType: data.feedbackType,
    })
  } catch (error) {
    console.error("[v0] Notification error:", error)
  }

  return { accessCode, id: entry.id }
}

export async function trackFeedback(accessCode: string): Promise<FeedbackEntry | null> {
  const accessCodeHash = await hashAccessCode(accessCode)
  const entry = await db.feedback.getByAccessCode(accessCodeHash)

  if (!entry) return null

  // Get category
  const allCategories = await db.categories.getAll()
  const category = allCategories.find((c) => c.id === entry.categoryId)

  // Get tags
  const feedbackTagRecords = await db.feedbackTags.getByFeedbackId(entry.id)
  const allTags = await db.tags.getAll()
  const entryTags = feedbackTagRecords.map((ft) => allTags.find((t) => t.id === ft.tagId)).filter(Boolean) as Tag[]

  // Get clarifications
  const clarifications = await db.clarifications.getByFeedbackId(entry.id)

  // Get responses
  const responses = await db.feedbackResponses.getByFeedbackId(entry.id)
  const allQuestions = await db.questions.getAll()

  return {
    id: entry.id,
    accessCodeHash: entry.accessCodeHash,
    categoryId: entry.categoryId || null,
    feedbackType: entry.feedbackType as FeedbackEntry["feedbackType"],
    urgency: entry.urgency as FeedbackEntry["urgency"],
    subject: entry.subject,
    description: entry.description,
    impact: entry.impact || null,
    suggestedSolution: entry.suggestedSolution || null,
    allowFollowUp: null,
    rating: null,
    status: entry.status as FeedbackEntry["status"],
    moderationStatus: entry.moderationStatus as FeedbackEntry["moderationStatus"],
    moderationFlags: [],
    moderationScore: entry.moderationScore || null,
    keywords: [],
    aiCategory: entry.aiCategoryId || null,
    aiSentiment: entry.aiSentiment as FeedbackEntry["aiSentiment"],
    aiPriority: entry.aiPriority as FeedbackEntry["aiPriority"],
    aiSummary: entry.aiSummary || null,
    aiKeywords: entry.aiKeywords || null,
    aiCategorySuggestion: null,
    aiUrgencySuggestion: null,
    aiActionItems: null,
    adminNotes: [],
    resolvedAt: entry.resolvedAt ? new Date(entry.resolvedAt).toISOString() : null,
    createdAt: new Date(entry.createdAt).toISOString(),
    updatedAt: new Date(entry.updatedAt).toISOString(),
    category: category?.name || "",
    categoryName: category?.name,
    categoryLabel: category?.label,
    tags: entryTags.map((t) => t.name),
    tagNames: entryTags.map((t) => t.name),
    clarifications: clarifications.map((c) => ({
      id: c.id,
      question: c.question,
      response: c.response || null,
      createdAt: new Date(c.askedAt).toISOString(),
      respondedAt: c.respondedAt ? new Date(c.respondedAt).toISOString() : null,
    })),
    responses: responses.map((r) => {
      const q = allQuestions.find((q) => q.id === r.questionId)
      return {
        questionId: r.questionId,
        questionText: q?.questionText || "",
        responseValue: r.responseValue,
      }
    }),
  }
}

export async function respondToClarification(
  accessCode: string,
  clarificationId: string,
  response: string,
): Promise<boolean> {
  const accessCodeHash = await hashAccessCode(accessCode)
  const entry = await db.feedback.getByAccessCode(accessCodeHash)

  if (!entry) return false

  // Verify clarification belongs to this feedback
  const clarifications = await db.clarifications.getByFeedbackId(entry.id)
  const clarification = clarifications.find((c) => c.id === clarificationId)

  if (!clarification) return false

  // Update clarification
  await db.clarifications.update(clarificationId, {
    response,
    respondedAt: new Date(),
  })

  // Notify admin
  try {
    await sendNotification("clarification_response", {
      id: entry.id,
      subject: entry.subject,
    })
  } catch (error) {
    console.error("[v0] Notification error:", error)
  }

  return true
}

export async function getAllFeedback(): Promise<FeedbackEntry[]> {
  const allFeedback = await db.feedback.getAll()
  const allCategories = await db.categories.getAll()
  const allTags = await db.tags.getAll()

  const entries: FeedbackEntry[] = []

  for (const entry of allFeedback) {
    const category = allCategories.find((c) => c.id === entry.categoryId)

    // Get tags
    const feedbackTagRecords = await db.feedbackTags.getByFeedbackId(entry.id)
    const entryTags = feedbackTagRecords.map((ft) => allTags.find((t) => t.id === ft.tagId)).filter(Boolean) as Tag[]

    // Get clarifications
    const clarifications = await db.clarifications.getByFeedbackId(entry.id)

    entries.push({
      id: entry.id,
      accessCodeHash: entry.accessCodeHash,
      categoryId: entry.categoryId || null,
      feedbackType: entry.feedbackType as FeedbackEntry["feedbackType"],
      urgency: entry.urgency as FeedbackEntry["urgency"],
      subject: entry.subject,
      description: entry.description,
      impact: entry.impact || null,
      suggestedSolution: entry.suggestedSolution || null,
      allowFollowUp: null,
      rating: null,
      status: entry.status as FeedbackEntry["status"],
      moderationStatus: entry.moderationStatus as FeedbackEntry["moderationStatus"],
      moderationFlags: [],
      moderationScore: entry.moderationScore || null,
      keywords: [],
      aiCategory: entry.aiCategoryId || null,
      aiSentiment: entry.aiSentiment as FeedbackEntry["aiSentiment"],
      aiPriority: entry.aiPriority as FeedbackEntry["aiPriority"],
      aiSummary: entry.aiSummary || null,
      aiKeywords: entry.aiKeywords || null,
      aiCategorySuggestion: null,
      aiUrgencySuggestion: null,
      aiActionItems: null,
      adminNotes: [],
      resolvedAt: entry.resolvedAt ? new Date(entry.resolvedAt).toISOString() : null,
      createdAt: new Date(entry.createdAt).toISOString(),
      updatedAt: new Date(entry.updatedAt).toISOString(),
      category: category?.name || "",
      categoryName: category?.name,
      categoryLabel: category?.label,
      tags: entryTags.map((t) => t.name),
      tagNames: entryTags.map((t) => t.name),
      clarifications: clarifications.map((c) => ({
        id: c.id,
        question: c.question,
        response: c.response || null,
        createdAt: new Date(c.askedAt).toISOString(),
        respondedAt: c.respondedAt ? new Date(c.respondedAt).toISOString() : null,
      })),
    })
  }

  return entries
}

export async function getFeedbackById(id: string): Promise<FeedbackEntry | null> {
  const entry = await db.feedback.getById(id)
  if (!entry) return null

  const allCategories = await db.categories.getAll()
  const allTags = await db.tags.getAll()
  const allQuestions = await db.questions.getAll()

  const category = allCategories.find((c) => c.id === entry.categoryId)

  // Get tags
  const feedbackTagRecords = await db.feedbackTags.getByFeedbackId(entry.id)
  const entryTags = feedbackTagRecords.map((ft) => allTags.find((t) => t.id === ft.tagId)).filter(Boolean) as Tag[]

  // Get clarifications
  const clarifications = await db.clarifications.getByFeedbackId(entry.id)

  // Get responses
  const responses = await db.feedbackResponses.getByFeedbackId(entry.id)

  return {
    id: entry.id,
    accessCodeHash: entry.accessCodeHash,
    categoryId: entry.categoryId || null,
    feedbackType: entry.feedbackType as FeedbackEntry["feedbackType"],
    urgency: entry.urgency as FeedbackEntry["urgency"],
    subject: entry.subject,
    description: entry.description,
    impact: entry.impact || null,
    suggestedSolution: entry.suggestedSolution || null,
    allowFollowUp: null,
    rating: null,
    status: entry.status as FeedbackEntry["status"],
    moderationStatus: entry.moderationStatus as FeedbackEntry["moderationStatus"],
    moderationFlags: [],
    moderationScore: entry.moderationScore || null,
    keywords: [],
    aiCategory: entry.aiCategoryId || null,
    aiSentiment: entry.aiSentiment as FeedbackEntry["aiSentiment"],
    aiPriority: entry.aiPriority as FeedbackEntry["aiPriority"],
    aiSummary: entry.aiSummary || null,
    aiKeywords: entry.aiKeywords || null,
    aiCategorySuggestion: null,
    aiUrgencySuggestion: null,
    aiActionItems: null,
    adminNotes: [],
    resolvedAt: entry.resolvedAt ? new Date(entry.resolvedAt).toISOString() : null,
    createdAt: new Date(entry.createdAt).toISOString(),
    updatedAt: new Date(entry.updatedAt).toISOString(),
    category: category?.name || "",
    categoryName: category?.name,
    categoryLabel: category?.label,
    tags: entryTags.map((t) => t.name),
    tagNames: entryTags.map((t) => t.name),
    clarifications: clarifications.map((c) => ({
      id: c.id,
      question: c.question,
      response: c.response || null,
      createdAt: new Date(c.askedAt).toISOString(),
      respondedAt: c.respondedAt ? new Date(c.respondedAt).toISOString() : null,
    })),
    responses: responses.map((r) => {
      const q = allQuestions.find((q) => q.id === r.questionId)
      return {
        questionId: r.questionId,
        questionText: q?.questionText || "",
        responseValue: r.responseValue,
      }
    }),
  }
}

export async function updateFeedbackStatus(id: string, status: "received" | "in-progress" | "resolved"): Promise<void> {
  const updateData: Partial<Feedback> = { status }

  if (status === "resolved") {
    updateData.resolvedAt = new Date()
  }

  await db.feedback.update(id, updateData)
}

export async function addClarificationRequest(feedbackId: string, question: string): Promise<void> {
  await db.clarifications.create({
    feedbackId,
    question,
  })

  // Notify reporter if they have notification settings
  const entry = await db.feedback.getById(feedbackId)
  if (entry?.reporterNotificationType && entry.reporterNotificationContact) {
    // Send notification to reporter
    try {
      if (entry.reporterNotificationType === "telegram") {
        const settings = await db.notifications.getByType("telegram")
        if (settings?.config) {
          const botToken = (settings.config as Record<string, string>).botToken
          if (botToken) {
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: entry.reporterNotificationContact,
                text: `📬 *Follow-up Question*\n\nA question has been asked about your feedback:\n\n"${question}"\n\nPlease respond using your access code.`,
                parse_mode: "Markdown",
              }),
            })
          }
        }
      }
    } catch (error) {
      console.error("[v0] Reporter notification error:", error)
    }
  }
}

export async function addAdminNote(id: string, note: string): Promise<void> {
  const entry = await db.feedback.getById(id)
  if (!entry) return

  await db.feedback.update(id, {
    adminNotes: `${entry.adminNotes || ""}\n[${new Date().toISOString()}] ${note}`.trim(),
  })
}

export async function getAnalytics() {
  const allFeedback = await db.feedback.getAll()
  const allCategories = await db.categories.getAll()

  const total = allFeedback.length
  const resolved = allFeedback.filter((f) => f.status === "resolved").length
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0

  // Status breakdown
  const statusCounts: Record<string, number> = {}
  allFeedback.forEach((f) => {
    statusCounts[f.status] = (statusCounts[f.status] || 0) + 1
  })
  const statusBreakdown = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  // Category breakdown
  const categoryCounts: Record<string, number> = {}
  allFeedback.forEach((f) => {
    const cat = allCategories.find((c) => c.id === f.categoryId)
    const catName = cat?.label || "Uncategorized"
    categoryCounts[catName] = (categoryCounts[catName] || 0) + 1
  })
  const categoryBreakdown = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }))

  // Urgency breakdown
  const urgencyCounts: Record<string, number> = {}
  allFeedback.forEach((f) => {
    urgencyCounts[f.urgency] = (urgencyCounts[f.urgency] || 0) + 1
  })
  const urgencyBreakdown = Object.entries(urgencyCounts).map(([name, value]) => ({ name, value }))

  // Type breakdown
  const typeCounts: Record<string, number> = {}
  allFeedback.forEach((f) => {
    typeCounts[f.feedbackType] = (typeCounts[f.feedbackType] || 0) + 1
  })
  const typeBreakdown = Object.entries(typeCounts).map(([name, value]) => ({ name, value }))

  // Sentiment breakdown
  const sentimentCounts: Record<string, number> = {}
  allFeedback.forEach((f) => {
    if (f.aiSentiment) {
      sentimentCounts[f.aiSentiment] = (sentimentCounts[f.aiSentiment] || 0) + 1
    }
  })
  const sentimentBreakdown = Object.entries(sentimentCounts).map(([name, value]) => ({ name, value }))

  // Daily trend (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const dailyCounts: Record<string, number> = {}
  allFeedback.forEach((f) => {
    const date = new Date(f.createdAt).toISOString().split("T")[0]
    if (date >= thirtyDaysAgo.toISOString().split("T")[0]) {
      dailyCounts[date] = (dailyCounts[date] || 0) + 1
    }
  })
  const dailyTrend = Object.entries(dailyCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Keywords aggregation
  const keywordCounts: Record<string, number> = {}
  allFeedback.forEach((f) => {
    if (f.aiKeywords) {
      f.aiKeywords.forEach((kw) => {
        keywordCounts[kw] = (keywordCounts[kw] || 0) + 1
      })
    }
  })
  const topKeywords = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }))

  return {
    total,
    resolved,
    resolutionRate,
    statusBreakdown,
    categoryBreakdown,
    urgencyBreakdown,
    typeBreakdown,
    sentimentBreakdown,
    dailyTrend,
    topKeywords,
    pending: allFeedback.filter((f) => f.status === "received").length,
    inProgress: allFeedback.filter((f) => f.status === "in_progress").length,
    avgResolutionTime: 0,
  }
}

export async function getBranding() {
  return db.branding.get()
}

export async function getFeedbackByAccessCode(accessCode: string): Promise<FeedbackEntry | null> {
  return trackFeedback(accessCode)
}

export async function requestClarification(feedbackId: string, question: string): Promise<void> {
  return addClarificationRequest(feedbackId, question)
}
