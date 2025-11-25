"use server"

import { db, supabaseAdmin } from "@/lib/db"
import type { FeedbackEntry } from "./feedback"

export async function updateModerationStatus(
  id: string,
  status: FeedbackEntry["moderationStatus"],
  reason?: string,
): Promise<boolean> {
  try {
    const entry = await db.feedback.getById(id)
    if (!entry) return false

    const updateData: Record<string, unknown> = {
      moderation_status: status,
    }

    if (reason && status === "rejected") {
      const currentNotes = entry.admin_notes || []
      updateData.admin_notes = [...currentNotes, `[MODERATION REJECTED] ${reason}`]
    }

    await db.feedback.update(id, updateData)
    return true
  } catch (error) {
    console.error("[v0] Error updating moderation status:", error)
    return false
  }
}

export async function getModerationStats() {
  try {
    const stats = await db.feedback.getStats()

    return {
      total: stats?.total || 0,
      pending: stats?.pendingModeration || 0,
      flagged: 0,
      approved: 0,
      rejected: 0,
    }
  } catch (error) {
    console.error("[v0] Error getting moderation stats:", error)
    return {
      total: 0,
      pending: 0,
      flagged: 0,
      approved: 0,
      rejected: 0,
    }
  }
}

export async function getFlaggedFeedback(): Promise<FeedbackEntry[]> {
  try {
    const { data: rows, error } = await supabaseAdmin
      .from("feedback")
      .select("*, category:categories(*)")
      .or("moderation_status.eq.flagged,moderation_status.eq.pending")
      .order("created_at", { ascending: false })

    if (error) throw error
    if (!rows) return []

    const enrichedEntries = await Promise.all(
      rows.map(async (row) => {
        const clarifications = await db.clarifications.getByFeedbackId(row.id)

        return {
          id: row.id,
          accessCodeHash: row.access_code_hash,
          categoryId: row.category_id,
          feedbackType: row.feedback_type as FeedbackEntry["feedbackType"],
          urgency: row.urgency as FeedbackEntry["urgency"],
          subject: row.subject,
          description: row.description,
          impact: row.impact,
          suggestedSolution: row.suggested_solution,
          allowFollowUp: row.allow_follow_up,
          rating: row.rating,
          status: row.status as FeedbackEntry["status"],
          moderationStatus: row.moderation_status as FeedbackEntry["moderationStatus"],
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
          category: row.category?.name || "",
          categoryName: row.category?.name,
          categoryLabel: row.category?.label,
          tags: [],
          tagNames: [],
          clarifications: clarifications.map((c) => ({
            id: c.id,
            question: c.question,
            response: c.response,
            createdAt: c.created_at,
            respondedAt: c.responded_at,
          })),
        }
      }),
    )

    return enrichedEntries
  } catch (error) {
    console.error("[v0] Error getting flagged feedback:", error)
    return []
  }
}

export async function bulkApprove(ids: string[]): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from("feedback")
      .update({
        moderation_status: "approved",
        updated_at: new Date().toISOString(),
      })
      .in("id", ids)

    if (error) throw error
    return true
  } catch (error) {
    console.error("[v0] Error bulk approving:", error)
    return false
  }
}

export async function bulkReject(ids: string[], reason: string): Promise<boolean> {
  try {
    for (const id of ids) {
      const entry = await db.feedback.getById(id)
      if (entry) {
        await db.feedback.update(id, {
          moderation_status: "rejected",
          admin_notes: [...(entry.admin_notes || []), `[BULK REJECTED] ${reason}`],
        })
      }
    }
    return true
  } catch (error) {
    console.error("[v0] Error bulk rejecting:", error)
    return false
  }
}
