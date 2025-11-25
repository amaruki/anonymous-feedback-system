"use server"

import { db, supabase } from "@/lib/db"
import type { FeedbackEntry } from "./feedback"

export async function updateModerationStatus(
  id: string,
  status: FeedbackEntry["moderationStatus"],
  reason?: string,
): Promise<boolean> {
  try {
    const entry = await db.feedback.getById(id)
    if (!entry) return false

    await db.feedback.update(id, {
      moderationStatus: status,
      moderationReason: reason || null,
    })
    return true
  } catch (error) {
    console.error("[v0] Error updating moderation status:", error)
    return false
  }
}

export async function getModerationStats() {
  try {
    const allFeedback = await db.feedback.getAll()

    return {
      total: allFeedback.length,
      pending: allFeedback.filter((f) => f.moderationStatus === "pending").length,
      flagged: allFeedback.filter((f) => f.moderationStatus === "flagged").length,
      approved: allFeedback.filter((f) => f.moderationStatus === "approved").length,
      rejected: allFeedback.filter((f) => f.moderationStatus === "rejected").length,
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
    const { data: rows, error } = await supabase
      .from("feedback")
      .select("*, category:categories(*)")
      .or("moderation_status.eq.flagged,moderation_status.eq.pending")
      .order("created_at", { ascending: false })

    if (error) throw error
    if (!rows) return []

    const allCategories = await db.categories.getAll()
    const allTags = await db.tags.getAll()

    const entries: FeedbackEntry[] = []

    for (const row of rows) {
      const category = allCategories.find((c) => c.id === row.category_id)
      const feedbackTagRecords = await db.feedbackTags.getByFeedbackId(row.id)
      const entryTags = feedbackTagRecords.map((ft) => allTags.find((t) => t.id === ft.tagId)).filter(Boolean)

      const clarifications = await db.clarifications.getByFeedbackId(row.id)

      entries.push({
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
        adminNotes: row.admin_notes || [],
        resolvedAt: row.resolved_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        category: category?.name || "",
        categoryName: category?.name,
        categoryLabel: category?.label,
        tags: entryTags.map((t) => t!.name),
        tagNames: entryTags.map((t) => t!.name),
        clarifications: clarifications.map((c) => ({
          id: c.id,
          question: c.question,
          response: c.response || null,
          createdAt: new Date(c.createdAt).toISOString(),
          respondedAt: c.respondedAt ? new Date(c.respondedAt).toISOString() : null,
        })),
      })
    }

    return entries
  } catch (error) {
    console.error("[v0] Error getting flagged feedback:", error)
    return []
  }
}

export async function bulkApprove(ids: string[]): Promise<boolean> {
  try {
    const { error } = await supabase
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
    const { error } = await supabase
      .from("feedback")
      .update({
        moderation_status: "rejected",
        moderation_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .in("id", ids)

    if (error) throw error
    return true
  } catch (error) {
    console.error("[v0] Error bulk rejecting:", error)
    return false
  }
}
