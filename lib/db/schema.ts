import { pgTable, uuid, text, boolean, integer, timestamp, jsonb, unique } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// Categories table
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  label: text("label").notNull(),
  description: text("description"),
  color: text("color").default("#6b7280"),
  icon: text("icon").default("folder"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

// Tags table
export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  color: text("color").default("#3b82f6"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
})

// Questions table
export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  questionType: text("question_type").notNull(), // 'rating', 'multiple_choice', 'text', 'textarea'
  questionText: text("question_text").notNull(),
  description: text("description"),
  options: jsonb("options"), // For multiple choice
  isRequired: boolean("is_required").default(false),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  minValue: integer("min_value"),
  maxValue: integer("max_value"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

// Branding settings
export const brandingSettings = pgTable("branding_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteName: text("site_name").default("Anonymous Feedback Portal"),
  siteDescription: text("site_description"),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#10b981"),
  secondaryColor: text("secondary_color").default("#6366f1"),
  accentColor: text("accent_color").default("#f59e0b"),
  trustBadge1Title: text("trust_badge_1_title").default("End-to-End Encryption"),
  trustBadge1Description: text("trust_badge_1_description"),
  trustBadge2Title: text("trust_badge_2_title").default("No IP Tracking"),
  trustBadge2Description: text("trust_badge_2_description"),
  trustBadge3Title: text("trust_badge_3_title").default("Anonymous Follow-ups"),
  trustBadge3Description: text("trust_badge_3_description"),
  customCss: text("custom_css"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

// Notification settings
export const notificationSettings = pgTable("notification_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  notificationType: text("notification_type").notNull().unique(), // 'email', 'slack', 'telegram', 'webhook'
  isEnabled: boolean("is_enabled").default(false),
  config: jsonb("config").notNull().default({}),
  notifyOnNewFeedback: boolean("notify_on_new_feedback").default(true),
  notifyOnUrgent: boolean("notify_on_urgent").default(true),
  notifyOnClarificationResponse: boolean("notify_on_clarification_response").default(true),
  notifyDailyDigest: boolean("notify_daily_digest").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

// Main feedback table
export const feedback = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  accessCodeHash: text("access_code_hash").notNull().unique(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  feedbackType: text("feedback_type").notNull(), // 'suggestion', 'concern', 'praise', 'question'
  urgency: text("urgency").notNull().default("medium"), // 'low', 'medium', 'high', 'critical'
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  impact: text("impact"),
  suggestedSolution: text("suggested_solution"),
  allowFollowUp: boolean("allow_follow_up").default(true),
  rating: integer("rating"),
  status: text("status").notNull().default("received"), // 'received', 'in-progress', 'resolved'
  moderationStatus: text("moderation_status").notNull().default("pending"), // 'pending', 'approved', 'flagged', 'rejected'
  moderationFlags: text("moderation_flags").array().default([]),
  moderationScore: integer("moderation_score").default(100),
  keywords: text("keywords").array().default([]),
  adminNotes: text("admin_notes").array().default([]),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

// Feedback tags junction table
export const feedbackTags = pgTable(
  "feedback_tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    feedbackId: uuid("feedback_id")
      .notNull()
      .references(() => feedback.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => ({
    unq: unique().on(t.feedbackId, t.tagId),
  }),
)

// Feedback question responses
export const feedbackResponses = pgTable(
  "feedback_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    feedbackId: uuid("feedback_id")
      .notNull()
      .references(() => feedback.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    responseValue: text("response_value"),
    responseNumber: integer("response_number"),
    responseOption: text("response_option"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    unq: unique().on(t.feedbackId, t.questionId),
  }),
)

// Clarifications
export const clarifications = pgTable("clarifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  feedbackId: uuid("feedback_id")
    .notNull()
    .references(() => feedback.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  response: text("response"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
})

// Admin users
export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  role: text("role").notNull().default("admin"), // 'admin', 'super_admin'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

// Relations
export const feedbackRelations = relations(feedback, ({ one, many }) => ({
  category: one(categories, {
    fields: [feedback.categoryId],
    references: [categories.id],
  }),
  tags: many(feedbackTags),
  responses: many(feedbackResponses),
  clarifications: many(clarifications),
}))

export const feedbackTagsRelations = relations(feedbackTags, ({ one }) => ({
  feedback: one(feedback, {
    fields: [feedbackTags.feedbackId],
    references: [feedback.id],
  }),
  tag: one(tags, {
    fields: [feedbackTags.tagId],
    references: [tags.id],
  }),
}))

export const feedbackResponsesRelations = relations(feedbackResponses, ({ one }) => ({
  feedback: one(feedback, {
    fields: [feedbackResponses.feedbackId],
    references: [feedback.id],
  }),
  question: one(questions, {
    fields: [feedbackResponses.questionId],
    references: [questions.id],
  }),
}))

export const clarificationsRelations = relations(clarifications, ({ one }) => ({
  feedback: one(feedback, {
    fields: [clarifications.feedbackId],
    references: [feedback.id],
  }),
}))

// Type exports
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type Tag = typeof tags.$inferSelect
export type NewTag = typeof tags.$inferInsert
export type Question = typeof questions.$inferSelect
export type NewQuestion = typeof questions.$inferInsert
export type BrandingSettings = typeof brandingSettings.$inferSelect
export type NotificationSetting = typeof notificationSettings.$inferSelect
export type Feedback = typeof feedback.$inferSelect
export type NewFeedback = typeof feedback.$inferInsert
export type FeedbackTag = typeof feedbackTags.$inferSelect
export type FeedbackResponse = typeof feedbackResponses.$inferSelect
export type Clarification = typeof clarifications.$inferSelect
export type AdminUser = typeof adminUsers.$inferSelect
