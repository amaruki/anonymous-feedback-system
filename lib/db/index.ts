import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side client with service role key for admin operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Type definitions for database tables
export interface Category {
  id: string
  name: string
  label: string
  description: string | null
  color: string
  icon: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  name: string
  color: string
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface Question {
  id: string
  question_type: "rating" | "multiple_choice" | "text" | "textarea"
  question_text: string
  description: string | null
  options: string[] | null
  is_required: boolean
  is_active: boolean
  sort_order: number
  min_value: number | null
  max_value: number | null
  created_at: string
  updated_at: string
}

export interface BrandingSettings {
  id: string
  site_name: string
  site_description: string | null
  logo_url: string | null
  primary_color: string
  secondary_color: string
  accent_color: string
  trust_badge_1_title: string
  trust_badge_1_description: string | null
  trust_badge_2_title: string
  trust_badge_2_description: string | null
  trust_badge_3_title: string
  trust_badge_3_description: string | null
  custom_css: string | null
  updated_at: string
}

export interface NotificationSetting {
  id: string
  notification_type: "email" | "slack" | "telegram" | "webhook"
  is_enabled: boolean
  config: Record<string, unknown>
  notify_on_new_feedback: boolean
  notify_on_urgent: boolean
  notify_on_clarification_response: boolean
  notify_daily_digest: boolean
  created_at: string
  updated_at: string
}

export interface Feedback {
  id: string
  access_code_hash: string
  category_id: string | null
  feedback_type: "suggestion" | "concern" | "praise" | "question"
  urgency: "low" | "medium" | "high" | "critical"
  subject: string
  description: string
  impact: string | null
  suggested_solution: string | null
  allow_follow_up: boolean
  rating: number | null
  status: "received" | "in-progress" | "resolved"
  moderation_status: "pending" | "approved" | "flagged" | "rejected"
  moderation_flags: string[]
  moderation_score: number
  keywords: string[]
  ai_category: string | null
  ai_sentiment: string | null
  ai_priority: string | null
  ai_summary: string | null
  ai_keywords: string[] | null
  ai_category_suggestion: string | null
  ai_urgency_suggestion: string | null
  ai_action_items: string[] | null
  admin_notes: string[]
  resolved_at: string | null
  created_at: string
  updated_at: string
  // Joined fields
  category?: Category
  tags?: Tag[]
}

export interface FeedbackTag {
  id: string
  feedback_id: string
  tag_id: string
}

export interface FeedbackResponse {
  id: string
  feedback_id: string
  question_id: string
  response_value: string | null
  response_number: number | null
  response_option: string | null
  created_at: string
}

export interface Clarification {
  id: string
  feedback_id: string
  question: string
  response: string | null
  created_at: string
  responded_at: string | null
}

export interface AdminUser {
  id: string
  email: string
  display_name: string | null
  role: "admin" | "super_admin"
  is_active: boolean
  created_at: string
  updated_at: string
}

// Database helper functions
export const db = {
  // Categories
  categories: {
    async getAll() {
      const { data, error } = await supabaseAdmin.from("categories").select("*").order("sort_order")
      if (error) throw error
      return data as Category[]
    },
    async getActive() {
      const { data, error } = await supabaseAdmin
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order")
      if (error) throw error
      return data as Category[]
    },
    async create(category: Partial<Category>) {
      const { data, error } = await supabaseAdmin.from("categories").insert(category).select().single()
      if (error) throw error
      return data as Category
    },
    async update(id: string, category: Partial<Category>) {
      const { data, error } = await supabaseAdmin
        .from("categories")
        .update({ ...category, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      return data as Category
    },
    async delete(id: string) {
      const { error } = await supabaseAdmin.from("categories").delete().eq("id", id)
      if (error) throw error
    },
  },

  // Tags
  tags: {
    async getAll() {
      const { data, error } = await supabaseAdmin.from("tags").select("*").order("sort_order")
      if (error) throw error
      return data as Tag[]
    },
    async getActive() {
      const { data, error } = await supabaseAdmin.from("tags").select("*").eq("is_active", true).order("sort_order")
      if (error) throw error
      return data as Tag[]
    },
    async create(tag: Partial<Tag>) {
      const { data, error } = await supabaseAdmin.from("tags").insert(tag).select().single()
      if (error) throw error
      return data as Tag
    },
    async update(id: string, tag: Partial<Tag>) {
      const { data, error } = await supabaseAdmin.from("tags").update(tag).eq("id", id).select().single()
      if (error) throw error
      return data as Tag
    },
    async delete(id: string) {
      const { error } = await supabaseAdmin.from("tags").delete().eq("id", id)
      if (error) throw error
    },
  },

  // Questions
  questions: {
    async getAll() {
      const { data, error } = await supabaseAdmin.from("questions").select("*").order("sort_order")
      if (error) throw error
      return data as Question[]
    },
    async getActive() {
      const { data, error } = await supabaseAdmin
        .from("questions")
        .select("*")
        .eq("is_active", true)
        .order("sort_order")
      if (error) throw error
      return data as Question[]
    },
    async create(question: Partial<Question>) {
      const { data, error } = await supabaseAdmin.from("questions").insert(question).select().single()
      if (error) throw error
      return data as Question
    },
    async update(id: string, question: Partial<Question>) {
      const { data, error } = await supabaseAdmin
        .from("questions")
        .update({ ...question, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      return data as Question
    },
    async delete(id: string) {
      const { error } = await supabaseAdmin.from("questions").delete().eq("id", id)
      if (error) throw error
    },
  },

  // Branding
  branding: {
    async get() {
      const { data, error } = await supabaseAdmin.from("branding_settings").select("*").limit(1).single()
      if (error && error.code !== "PGRST116") throw error
      return data as BrandingSettings | null
    },
    async upsert(settings: Partial<BrandingSettings>) {
      const existing = await this.get()
      if (existing) {
        const { data, error } = await supabaseAdmin
          .from("branding_settings")
          .update({ ...settings, updated_at: new Date().toISOString() })
          .eq("id", existing.id)
          .select()
          .single()
        if (error) throw error
        return data as BrandingSettings
      } else {
        const { data, error } = await supabaseAdmin.from("branding_settings").insert(settings).select().single()
        if (error) throw error
        return data as BrandingSettings
      }
    },
  },

  // Notification Settings
  notifications: {
    async getAll() {
      const { data, error } = await supabaseAdmin.from("notification_settings").select("*")
      if (error) throw error
      return data as NotificationSetting[]
    },
    async getByType(type: string) {
      const { data, error } = await supabaseAdmin
        .from("notification_settings")
        .select("*")
        .eq("notification_type", type)
        .single()
      if (error && error.code !== "PGRST116") throw error
      return data as NotificationSetting | null
    },
    async upsert(type: string, settings: Partial<NotificationSetting>) {
      const { data, error } = await supabaseAdmin
        .from("notification_settings")
        .upsert(
          { ...settings, notification_type: type, updated_at: new Date().toISOString() },
          { onConflict: "notification_type" },
        )
        .select()
        .single()
      if (error) throw error
      return data as NotificationSetting
    },
  },

  // Feedback
  feedback: {
    async getAll(options?: { status?: string; moderationStatus?: string; limit?: number }) {
      let query = supabaseAdmin.from("feedback").select("*, category:categories(*)")

      if (options?.status) {
        query = query.eq("status", options.status)
      }
      if (options?.moderationStatus) {
        query = query.eq("moderation_status", options.moderationStatus)
      }
      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query.order("created_at", { ascending: false })
      if (error) throw error
      return data as Feedback[]
    },
    async getById(id: string) {
      const { data, error } = await supabaseAdmin
        .from("feedback")
        .select("*, category:categories(*)")
        .eq("id", id)
        .single()
      if (error) throw error

      // Get tags
      const { data: tagData } = await supabaseAdmin.from("feedback_tags").select("tag:tags(*)").eq("feedback_id", id)

      return {
        ...data,
        tags: tagData?.map((t: { tag: Tag }) => t.tag) || [],
      } as Feedback
    },
    async getByAccessCodeHash(hash: string) {
      const { data, error } = await supabaseAdmin
        .from("feedback")
        .select("*, category:categories(*)")
        .eq("access_code_hash", hash)
        .single()
      if (error && error.code !== "PGRST116") throw error

      if (!data) return null

      // Get tags
      const { data: tagData } = await supabaseAdmin
        .from("feedback_tags")
        .select("tag:tags(*)")
        .eq("feedback_id", data.id)

      // Get clarifications
      const { data: clarifications } = await supabaseAdmin
        .from("clarifications")
        .select("*")
        .eq("feedback_id", data.id)
        .order("created_at", { ascending: true })

      return {
        ...data,
        tags: tagData?.map((t: { tag: Tag }) => t.tag) || [],
        clarifications: clarifications || [],
      } as Feedback & { clarifications: Clarification[] }
    },
    async create(feedback: Partial<Feedback>, tagIds?: string[]) {
      const { data, error } = await supabaseAdmin.from("feedback").insert(feedback).select().single()
      if (error) throw error

      // Add tags
      if (tagIds && tagIds.length > 0) {
        await supabaseAdmin.from("feedback_tags").insert(
          tagIds.map((tagId) => ({
            feedback_id: data.id,
            tag_id: tagId,
          })),
        )
      }

      return data as Feedback
    },
    async update(id: string, feedback: Partial<Feedback>) {
      const { data, error } = await supabaseAdmin
        .from("feedback")
        .update({ ...feedback, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      return data as Feedback
    },
    async updateTags(feedbackId: string, tagIds: string[]) {
      // Remove existing tags
      await supabaseAdmin.from("feedback_tags").delete().eq("feedback_id", feedbackId)

      // Add new tags
      if (tagIds.length > 0) {
        await supabaseAdmin.from("feedback_tags").insert(
          tagIds.map((tagId) => ({
            feedback_id: feedbackId,
            tag_id: tagId,
          })),
        )
      }
    },
    async delete(id: string) {
      const { error } = await supabaseAdmin.from("feedback").delete().eq("id", id)
      if (error) throw error
    },
    async getStats() {
      const { data: all } = await supabaseAdmin
        .from("feedback")
        .select("status, urgency, moderation_status, ai_sentiment, category_id, created_at")

      if (!all) return null

      const total = all.length
      const byStatus = {
        received: all.filter((f) => f.status === "received").length,
        "in-progress": all.filter((f) => f.status === "in-progress").length,
        resolved: all.filter((f) => f.status === "resolved").length,
      }
      const byUrgency = {
        low: all.filter((f) => f.urgency === "low").length,
        medium: all.filter((f) => f.urgency === "medium").length,
        high: all.filter((f) => f.urgency === "high").length,
        critical: all.filter((f) => f.urgency === "critical").length,
      }
      const bySentiment = {
        positive: all.filter((f) => f.ai_sentiment === "positive").length,
        neutral: all.filter((f) => f.ai_sentiment === "neutral").length,
        negative: all.filter((f) => f.ai_sentiment === "negative").length,
        mixed: all.filter((f) => f.ai_sentiment === "mixed").length,
      }
      const pendingModeration = all.filter((f) => f.moderation_status === "pending").length

      return { total, byStatus, byUrgency, bySentiment, pendingModeration }
    },
  },

  // Clarifications
  clarifications: {
    async getByFeedbackId(feedbackId: string) {
      const { data, error } = await supabaseAdmin
        .from("clarifications")
        .select("*")
        .eq("feedback_id", feedbackId)
        .order("created_at", { ascending: true })
      if (error) throw error
      return data as Clarification[]
    },
    async create(clarification: Partial<Clarification>) {
      const { data, error } = await supabaseAdmin.from("clarifications").insert(clarification).select().single()
      if (error) throw error
      return data as Clarification
    },
    async respond(id: string, response: string) {
      const { data, error } = await supabaseAdmin
        .from("clarifications")
        .update({ response, responded_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      return data as Clarification
    },
  },

  // Feedback Responses (question answers)
  feedbackResponses: {
    async getByFeedbackId(feedbackId: string) {
      const { data, error } = await supabaseAdmin
        .from("feedback_responses")
        .select("*, question:questions(*)")
        .eq("feedback_id", feedbackId)
      if (error) throw error
      return data as (FeedbackResponse & { question: Question })[]
    },
    async create(responses: Partial<FeedbackResponse>[]) {
      const { data, error } = await supabaseAdmin.from("feedback_responses").insert(responses).select()
      if (error) throw error
      return data as FeedbackResponse[]
    },
  },

  // Admin Users
  adminUsers: {
    async getByEmail(email: string) {
      const { data, error } = await supabaseAdmin.from("admin_users").select("*").eq("email", email).single()
      if (error && error.code !== "PGRST116") throw error
      return data as AdminUser | null
    },
    async create(user: Partial<AdminUser>) {
      const { data, error } = await supabaseAdmin.from("admin_users").insert(user).select().single()
      if (error) throw error
      return data as AdminUser
    },
  },
}
