import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Utility to convert snake_case to camelCase
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

// Convert object keys from snake_case to camelCase
export function toCamelCase<T>(obj: Record<string, unknown>): T {
  if (obj === null || typeof obj !== "object") return obj as T
  if (Array.isArray(obj)) return obj.map((item) => toCamelCase(item)) as T

  const result: Record<string, unknown> = {}
  for (const key in obj) {
    const camelKey = snakeToCamel(key)
    const value = obj[key]
    result[camelKey] =
      value !== null && typeof value === "object" ? toCamelCase(value as Record<string, unknown>) : value
  }
  return result as T
}

// Convert object keys from camelCase to snake_case for inserts/updates
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

export function toSnakeCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key in obj) {
    const snakeKey = camelToSnake(key)
    result[snakeKey] = obj[key]
  }
  return result
}

// TypeScript interfaces with camelCase for app usage
export interface Category {
  id: string
  name: string
  label: string
  description?: string | null
  color: string
  icon: string
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface Tag {
  id: string
  name: string
  color: string
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface Question {
  id: string
  questionText: string
  questionType: "text" | "textarea" | "rating" | "select" | "multiselect" | "checkbox"
  options?: string | null
  isRequired: boolean
  isActive: boolean
  sortOrder: number
  minValue?: number | null
  maxValue?: number | null
  placeholder?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface BrandingSettings {
  id: string
  siteName: string
  siteDescription?: string | null
  logoUrl?: string | null
  faviconUrl?: string | null
  primaryColor: string
  secondaryColor?: string | null
  accentColor?: string | null
  trustBadge1Title?: string | null
  trustBadge1Description?: string | null
  trustBadge2Title?: string | null
  trustBadge2Description?: string | null
  trustBadge3Title?: string | null
  trustBadge3Description?: string | null
  customCss?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface NotificationSetting {
  id: string
  notificationType: "email" | "slack" | "telegram" | "webhook"
  isEnabled: boolean
  config: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface Feedback {
  id: string
  accessCode: string
  accessCodeHash: string
  categoryId?: string | null
  feedbackType: string
  urgency: string
  subject: string
  description: string
  impact?: string | null
  suggestedSolution?: string | null
  status: "received" | "in-progress" | "resolved" | "rejected"
  moderationStatus: "pending" | "approved" | "rejected" | "flagged"
  moderationReason?: string | null
  moderationScore?: number | null
  allowFollowUp: boolean | null
  adminNotes?: string | null
  resolvedAt?: Date | null
  reporterNotificationType?: "email" | "telegram" | null
  reporterNotificationContact?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface FeedbackTag {
  id: string
  feedbackId: string
  tagId: string
}

export interface FeedbackResponse {
  id: string
  feedbackId: string
  questionId: string
  responseValue: string
  createdAt: Date
}

export interface Clarification {
  id: string
  feedbackId: string
  question: string
  response?: string | null
  createdAt: Date
  respondedAt?: Date | null
}

export interface AdminUser {
  id: string
  email: string
  name?: string | null
  role: "admin" | "moderator" | "viewer"
  createdAt: Date
  updatedAt: Date
}

// Database helper functions
export const db = {
  // Categories
  categories: {
    async getAll(): Promise<Category[]> {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order", { ascending: true })
      if (error) throw error
      return (data || []).map((row) => toCamelCase<Category>(row))
    },
    async getActive(): Promise<Category[]> {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
      if (error) throw error
      return (data || []).map((row) => toCamelCase<Category>(row))
    },
    async create(values: Partial<Category>): Promise<Category> {
      const { data, error } = await supabase.from("categories").insert(toSnakeCase(values)).select().single()
      if (error) throw error
      return toCamelCase<Category>(data)
    },
    async update(id: string, values: Partial<Category>): Promise<void> {
      const { error } = await supabase
        .from("categories")
        .update({ ...toSnakeCase(values), updated_at: new Date().toISOString() })
        .eq("id", id)
      if (error) throw error
    },
    async delete(id: string): Promise<void> {
      const { error } = await supabase.from("categories").delete().eq("id", id)
      if (error) throw error
    },
  },

  // Tags
  tags: {
    async getAll(): Promise<Tag[]> {
      const { data, error } = await supabase.from("tags").select("*").order("sort_order", { ascending: true })
      if (error) throw error
      return (data || []).map((row) => toCamelCase<Tag>(row))
    },
    async getActive(): Promise<Tag[]> {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
      if (error) throw error
      return (data || []).map((row) => toCamelCase<Tag>(row))
    },
    async create(values: Partial<Tag>): Promise<Tag> {
      const { data, error } = await supabase.from("tags").insert(toSnakeCase(values)).select().single()
      if (error) throw error
      return toCamelCase<Tag>(data)
    },
    async update(id: string, values: Partial<Tag>): Promise<void> {
      const { error } = await supabase
        .from("tags")
        .update({ ...toSnakeCase(values), updated_at: new Date().toISOString() })
        .eq("id", id)
      if (error) throw error
    },
    async delete(id: string): Promise<void> {
      const { error } = await supabase.from("tags").delete().eq("id", id)
      if (error) throw error
    },
  },

  // Questions
  questions: {
    async getAll(): Promise<Question[]> {
      const { data, error } = await supabase.from("questions").select("*").order("sort_order", { ascending: true })
      if (error) throw error
      return (data || []).map((row) => toCamelCase<Question>(row))
    },
    async getActive(): Promise<Question[]> {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
      if (error) throw error
      return (data || []).map((row) => toCamelCase<Question>(row))
    },
    async create(values: Partial<Question>): Promise<Question> {
      const { data, error } = await supabase.from("questions").insert(toSnakeCase(values)).select().single()
      if (error) throw error
      return toCamelCase<Question>(data)
    },
    async update(id: string, values: Partial<Question>): Promise<void> {
      const { error } = await supabase
        .from("questions")
        .update({ ...toSnakeCase(values), updated_at: new Date().toISOString() })
        .eq("id", id)
      if (error) throw error
    },
    async delete(id: string): Promise<void> {
      const { error } = await supabase.from("questions").delete().eq("id", id)
      if (error) throw error
    },
  },

  // Branding
  branding: {
    async get(): Promise<BrandingSettings | null> {
      const { data, error } = await supabase.from("branding_settings").select("*").limit(1).single()
      if (error && error.code !== "PGRST116") throw error
      return data ? toCamelCase<BrandingSettings>(data) : null
    },
    async upsert(values: Partial<BrandingSettings>): Promise<BrandingSettings> {
      const existing = await this.get()
      if (existing) {
        const { data, error } = await supabase
          .from("branding_settings")
          .update({ ...toSnakeCase(values), updated_at: new Date().toISOString() })
          .eq("id", existing.id)
          .select()
          .single()
        if (error) throw error
        return toCamelCase<BrandingSettings>(data)
      } else {
        const { data, error } = await supabase.from("branding_settings").insert(toSnakeCase(values)).select().single()
        if (error) throw error
        return toCamelCase<BrandingSettings>(data)
      }
    },
  },

  // Notifications
  notifications: {
    async getAll(): Promise<NotificationSetting[]> {
      const { data, error } = await supabase.from("notification_settings").select("*")
      if (error) throw error
      return (data || []).map((row) => toCamelCase<NotificationSetting>(row))
    },
    async getByType(type: string): Promise<NotificationSetting | null> {
      const { data, error } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("notification_type", type)
        .single()
      if (error && error.code !== "PGRST116") throw error
      return data ? toCamelCase<NotificationSetting>(data) : null
    },
    async upsert(values: Partial<NotificationSetting>): Promise<NotificationSetting> {
      const snakeValues = toSnakeCase(values)
      const { data, error } = await supabase
        .from("notification_settings")
        .upsert(snakeValues, { onConflict: "notification_type" })
        .select()
        .single()
      if (error) throw error
      return toCamelCase<NotificationSetting>(data)
    },
    async update(id: string, values: Partial<NotificationSetting>): Promise<void> {
      const { error } = await supabase
        .from("notification_settings")
        .update({ ...toSnakeCase(values), updated_at: new Date().toISOString() })
        .eq("id", id)
      if (error) throw error
    },
  },

  // Feedback
  feedback: {
    async getAll(): Promise<Feedback[]> {
      const { data, error } = await supabase.from("feedback").select("*").order("created_at", { ascending: false })
      if (error) throw error
      return (data || []).map((row) => toCamelCase<Feedback>(row))
    },
    async getById(id: string): Promise<Feedback | null> {
      const { data, error } = await supabase.from("feedback").select("*").eq("id", id).single()
      if (error && error.code !== "PGRST116") throw error
      return data ? toCamelCase<Feedback>(data) : null
    },
    async getByAccessCode(accessCodeHash: string): Promise<Feedback | null> {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .eq("access_code_hash", accessCodeHash)
        .single()
      if (error && error.code !== "PGRST116") throw error
      return data ? toCamelCase<Feedback>(data) : null
    },
    async getByStatus(status: string): Promise<Feedback[]> {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .eq("status", status)
        .order("created_at", { ascending: false })
      if (error) throw error
      return (data || []).map((row) => toCamelCase<Feedback>(row))
    },
    async getByModerationStatus(status: string): Promise<Feedback[]> {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .eq("moderation_status", status)
        .order("created_at", { ascending: false })
      if (error) throw error
      return (data || []).map((row) => toCamelCase<Feedback>(row))
    },
    async create(values: Partial<Feedback>): Promise<Feedback> {
      const { data, error } = await supabase.from("feedback").insert(toSnakeCase(values)).select().single()
      if (error) throw error
      return toCamelCase<Feedback>(data)
    },
    async update(id: string, values: Partial<Feedback>): Promise<void> {
      const { error } = await supabase
        .from("feedback")
        .update({ ...toSnakeCase(values), updated_at: new Date().toISOString() })
        .eq("id", id)
      if (error) throw error
    },
  },

  // Feedback Tags
  feedbackTags: {
    async getByFeedbackId(feedbackId: string): Promise<FeedbackTag[]> {
      const { data, error } = await supabase.from("feedback_tags").select("*").eq("feedback_id", feedbackId)
      if (error) throw error
      return (data || []).map((row) => toCamelCase<FeedbackTag>(row))
    },
    async create(values: { feedbackId: string; tagId: string }): Promise<FeedbackTag> {
      const { data, error } = await supabase.from("feedback_tags").insert(toSnakeCase(values)).select().single()
      if (error) throw error
      return toCamelCase<FeedbackTag>(data)
    },
    async deleteByFeedbackId(feedbackId: string): Promise<void> {
      const { error } = await supabase.from("feedback_tags").delete().eq("feedback_id", feedbackId)
      if (error) throw error
    },
  },

  // Feedback Responses
  feedbackResponses: {
    async getByFeedbackId(feedbackId: string): Promise<FeedbackResponse[]> {
      const { data, error } = await supabase.from("feedback_responses").select("*").eq("feedback_id", feedbackId)
      if (error) throw error
      return (data || []).map((row) => toCamelCase<FeedbackResponse>(row))
    },
    async create(values: Partial<FeedbackResponse>): Promise<FeedbackResponse> {
      const { data, error } = await supabase.from("feedback_responses").insert(toSnakeCase(values)).select().single()
      if (error) throw error
      return toCamelCase<FeedbackResponse>(data)
    },
  },

  // Clarifications
  clarifications: {
    async getByFeedbackId(feedbackId: string): Promise<Clarification[]> {
      const { data, error } = await supabase
        .from("clarifications")
        .select("*")
        .eq("feedback_id", feedbackId)
        .order("created_at", { ascending: true })
      if (error) throw error
      return (data || []).map((row) => toCamelCase<Clarification>(row))
    },
    async create(values: Partial<Clarification>): Promise<Clarification> {
      const { data, error } = await supabase.from("clarifications").insert(toSnakeCase(values)).select().single()
      if (error) throw error
      return toCamelCase<Clarification>(data)
    },
    async update(id: string, values: Partial<Clarification>): Promise<void> {
      const { error } = await supabase.from("clarifications").update(toSnakeCase(values)).eq("id", id)
      if (error) throw error
    },
  },
}
