"use server"

import { db, type Feedback, type Category, type Tag, type Clarification } from "@/lib/db"
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

  // Find category ID
  let categoryId: string | null = null
  const allCategories = await db.categories.getActive()
  const matchedCategory = allCategories.find((c) => c.name === data.category)
  categoryId = matchedCategory?.id || null

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
  const entry = await db.feedback.create(
    {
      access_code_hash: accessCodeHash,
      category_id: categoryId,
      feedback_type: data.feedbackType as Feedback["feedback_type"],
      urgency: data.urgency as Feedback["urgency"],
      subject: data.subject,
      description: data.description,
      impact: data.impact || null,
      suggested_solution: data.suggestedSolution || null,
      allow_follow_up: data.allowFollowUp,
      status: "received",
      moderation_status: moderation.passed ? "approved" : "flagged",
      moderation_flags: moderation.flags,
      moderation_score: moderation.score,
      keywords,
      ai_category: aiAnalysis?.suggestedCategory || null,
      ai_sentiment: aiAnalysis?.sentiment || null,
      ai_priority: aiAnalysis?.suggestedUrgency || null,
      ai_summary: aiAnalysis?.summary || null,
      ai_keywords: aiAnalysis?.keyTopics || null,
      ai_category_suggestion: aiAnalysis?.suggestedCategory || null,
      ai_urgency_suggestion: aiAnalysis?.suggestedUrgency || null,
      ai_action_items: aiAnalysis?.actionItems || null,
      admin_notes: [],
    },
    tagIds,
  )

  // Insert question responses
  if (data.questionResponses) {
    const questions = await db.questions.getActive()
    const responses = Object.entries(data.questionResponses)
      .map(([questionId, response]) => {
        const question = questions.find((q) => q.id === questionId)
        if (!question) return null
        return {
          feedback_id: entry.id,
          question_id: questionId,
          response_value: response.type === "text" || response.type === "textarea" ? String(response.value) : null,
          response_number: response.type === "rating" ? Number(response.value) : null,
          response_option: response.type === "multiple_choice" ? String(response.value) : null,
        }
      })
      .filter(Boolean) as Array<{
      feedback_id: string
      question_id: string
      response_value: string | null
      response_number: number | null
      response_option: string | null
    }>

    if (responses.length > 0) {
      await db.feedbackResponses.create(responses)
    }
  }

  await sendNotification("new_feedback", {
    id: entry.id,
    subject: entry.subject,
    category: data.category,
    urgency: data.urgency,
    feedbackType: data.feedbackType,
  })

  return { accessCode, id: entry.id }
}

function transformFeedbackToEntry(
  row: Feedback,
  categoryData?: Category | null,
  tagNames?: string[],
  clarificationsList?: Clarification[],
): FeedbackEntry {
  return {
    id: row.id,
    accessCodeHash: row.access_code_hash,
    categoryId: row.category_id,
    feedbackType: row.feedback_type,
    urgency: row.urgency,
    subject: row.subject,
    description: row.description,
    impact: row.impact,
    suggestedSolution: row.suggested_solution,
    allowFollowUp: row.allow_follow_up,
    rating: row.rating,
    status: row.status,
    moderationStatus: row.moderation_status,
    moderationFlags: row.moderation_flags || [],
    moderationScore: row.moderation_score,
    keywords: row.keywords || [],
    aiCategory: row.ai_category,
    aiSentiment: row.ai_sentiment as FeedbackEntry["aiSentiment"],
    aiPriority: row.ai_priority as FeedbackEntry["aiPriority"],
    aiSummary: row.ai_summary,
    aiKeywords: row.ai_keywords,
    aiCategorySuggestion: row.ai_category_suggestion,
    aiUrgencySuggestion: row.ai_urgency_suggestion,
    aiActionItems: row.ai_action_items,
    adminNotes: row.admin_notes || [],
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    category: categoryData?.name || "",
    categoryName: categoryData?.name,
    categoryLabel: categoryData?.label,
    tags: tagNames || [],
    tagNames,
    clarifications: (clarificationsList || []).map((c) => ({
      id: c.id,
      question: c.question,
      response: c.response,
      createdAt: c.created_at,
      respondedAt: c.responded_at,
    })),
  }
}

export async function getFeedbackByAccessCode(accessCode: string): Promise<FeedbackEntry | null> {
  const hash = await hashAccessCode(accessCode)
  const result = await db.feedback.getByAccessCodeHash(hash)

  if (!result) return null

  const clarifications = await db.clarifications.getByFeedbackId(result.id)

  return transformFeedbackToEntry(
    result,
    result.category as Category | undefined,
    result.tags?.map((t: Tag) => t.name),
    clarifications,
  )
}

export async function respondToClarification(
  accessCode: string,
  clarificationId: string,
  response: string,
): Promise<boolean> {
  const hash = await hashAccessCode(accessCode)
  const entry = await db.feedback.getByAccessCodeHash(hash)

  if (!entry) return false

  const clarifications = await db.clarifications.getByFeedbackId(entry.id)
  const clarification = clarifications.find((c) => c.id === clarificationId)

  if (!clarification) return false

  await db.clarifications.respond(clarificationId, response)
  await db.feedback.update(entry.id, {})

  await sendNotification("clarification_response", {
    feedbackId: entry.id,
    subject: entry.subject,
  })

  return true
}

export async function getAllFeedback(filters?: {
  status?: string
  urgency?: string
  category?: string
  moderationStatus?: string
}): Promise<FeedbackEntry[]> {
  const entries = await db.feedback.getAll({
    status: filters?.status,
    moderationStatus: filters?.moderationStatus,
  })

  const enrichedEntries = await Promise.all(
    entries.map(async (entry) => {
      const clarifications = await db.clarifications.getByFeedbackId(entry.id)
      return transformFeedbackToEntry(
        entry,
        entry.category as Category | undefined,
        entry.tags?.map((t: Tag) => t.name),
        clarifications,
      )
    }),
  )

  // Apply additional filters
  let result = enrichedEntries
  if (filters?.urgency) {
    result = result.filter((e) => e.urgency === filters.urgency)
  }
  if (filters?.category) {
    result = result.filter((e) => e.categoryName === filters.category)
  }

  return result
}

export async function updateFeedbackStatus(id: string, status: FeedbackEntry["status"]): Promise<boolean> {
  const updateData: Partial<Feedback> = { status }
  if (status === "resolved") {
    updateData.resolved_at = new Date().toISOString()
  }
  await db.feedback.update(id, updateData)
  return true
}

export async function requestClarification(id: string, question: string): Promise<boolean> {
  const entry = await db.feedback.getById(id)
  if (!entry || !entry.allow_follow_up) return false

  await db.clarifications.create({
    feedback_id: id,
    question,
  })

  return true
}

export async function addAdminNote(id: string, note: string): Promise<boolean> {
  const entry = await db.feedback.getById(id)
  if (!entry) return false

  const timestamp = new Date().toISOString()
  const newNotes = [...(entry.admin_notes || []), `[${timestamp}] ${note}`]

  await db.feedback.update(id, { admin_notes: newNotes })
  return true
}

export async function updateModerationStatus(
  id: string,
  status: "approved" | "flagged" | "rejected",
): Promise<boolean> {
  await db.feedback.update(id, { moderation_status: status })
  return true
}

export async function getAnalytics() {
  const stats = await db.feedback.getStats()
  const allFeedback = await db.feedback.getAll({})
  const categories = await db.categories.getAll()

  // Calculate category breakdown
  const categoryBreakdown = categories
    .map((cat) => ({
      name: cat.label,
      value: allFeedback.filter((f) => f.category_id === cat.id).length,
    }))
    .filter((c) => c.value > 0)

  // Urgency breakdown
  const urgencyBreakdown = [
    { name: "low", value: stats?.byUrgency.low || 0 },
    { name: "medium", value: stats?.byUrgency.medium || 0 },
    { name: "high", value: stats?.byUrgency.high || 0 },
    { name: "critical", value: stats?.byUrgency.critical || 0 },
  ]

  // Status breakdown
  const statusBreakdown = [
    { name: "received", value: stats?.byStatus.received || 0 },
    { name: "in-progress", value: stats?.byStatus["in-progress"] || 0 },
    { name: "resolved", value: stats?.byStatus.resolved || 0 },
  ]

  // Sentiment breakdown
  const sentimentBreakdown = [
    { name: "positive", value: stats?.bySentiment.positive || 0 },
    { name: "neutral", value: stats?.bySentiment.neutral || 0 },
    { name: "negative", value: stats?.bySentiment.negative || 0 },
    { name: "mixed", value: stats?.bySentiment.mixed || 0 },
  ].filter((s) => s.value > 0)

  // Calculate keyword frequency
  const keywordCount: Record<string, number> = {}
  allFeedback.forEach((f) => {
    ;(f.keywords || []).forEach((kw) => {
      keywordCount[kw] = (keywordCount[kw] || 0) + 1
    })
  })

  // Daily trend
  const dailyMap: Record<string, number> = {}
  allFeedback.forEach((f) => {
    const date = f.created_at.split("T")[0]
    dailyMap[date] = (dailyMap[date] || 0) + 1
  })

  const dailyTrend = Object.entries(dailyMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const total = stats?.total || 0
  const resolved = stats?.byStatus.resolved || 0

  return {
    total,
    categoryBreakdown,
    urgencyBreakdown,
    statusBreakdown,
    typeBreakdown: [],
    sentimentBreakdown,
    topKeywords: Object.entries(keywordCount)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20),
    averageRatings: {},
    dailyTrend,
    resolutionRate: total ? ((resolved / total) * 100).toFixed(1) : "0",
  }
}

export async function getBranding() {
  try {
    const settings = await db.branding.get()

    if (!settings) {
      return {
        siteName: "Anonymous Feedback Portal",
        logoUrl: null,
        primaryColor: "#10b981",
        description: "Share your thoughts openly and honestly.",
        secondaryColor: "#6366f1",
        accentColor: "#f59e0b",
        trustBadge1Title: "End-to-End Encryption",
        trustBadge1Description: "Your feedback is encrypted before transmission",
        trustBadge2Title: "No IP Tracking",
        trustBadge2Description: "We strip all identifying metadata",
        trustBadge3Title: "Anonymous Follow-ups",
        trustBadge3Description: "Communicate without revealing identity",
      }
    }

    return {
      siteName: settings.site_name || "Anonymous Feedback Portal",
      logoUrl: settings.logo_url,
      primaryColor: settings.primary_color || "#10b981",
      description: settings.site_description || "Share your thoughts openly and honestly.",
      secondaryColor: settings.secondary_color || "#6366f1",
      accentColor: settings.accent_color || "#f59e0b",
      trustBadge1Title: settings.trust_badge_1_title || "End-to-End Encryption",
      trustBadge1Description: settings.trust_badge_1_description || "Your feedback is encrypted before transmission",
      trustBadge2Title: settings.trust_badge_2_title || "No IP Tracking",
      trustBadge2Description: settings.trust_badge_2_description || "We strip all identifying metadata",
      trustBadge3Title: settings.trust_badge_3_title || "Anonymous Follow-ups",
      trustBadge3Description: settings.trust_badge_3_description || "Communicate without revealing identity",
    }
  } catch (error) {
    console.error("[v0] Error fetching branding:", error)
    return {
      siteName: "Anonymous Feedback Portal",
      logoUrl: null,
      primaryColor: "#10b981",
      description: "Share your thoughts openly and honestly.",
      secondaryColor: "#6366f1",
      accentColor: "#f59e0b",
      trustBadge1Title: "End-to-End Encryption",
      trustBadge1Description: "Your feedback is encrypted before transmission",
      trustBadge2Title: "No IP Tracking",
      trustBadge2Description: "We strip all identifying metadata",
      trustBadge3Title: "Anonymous Follow-ups",
      trustBadge3Description: "Communicate without revealing identity",
    }
  }
}

export async function getFormConfiguration() {
  try {
    const [categoriesList, tagsList, questionsList] = await Promise.all([
      db.categories.getActive(),
      db.tags.getActive(),
      db.questions.getActive(),
    ])

    return {
      categories: categoriesList.map((c) => ({
        id: c.id,
        name: c.name,
        label: c.label,
        description: c.description,
        color: c.color,
        icon: c.icon,
      })),
      tags: tagsList.map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
      })),
      questions: questionsList.map((q) => ({
        id: q.id,
        questionType: q.question_type,
        questionText: q.question_text,
        description: q.description,
        options: q.options,
        isRequired: q.is_required,
        minValue: q.min_value,
        maxValue: q.max_value,
      })),
    }
  } catch (error) {
    console.error("[v0] Error fetching form configuration:", error)
    return { categories: [], tags: [], questions: [] }
  }
}
