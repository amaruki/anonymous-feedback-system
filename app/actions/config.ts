"use server"

import { db, type Category, type Tag, type Question, type BrandingSettings, type NotificationSetting } from "@/lib/db"
import { revalidatePath } from "next/cache"

// Categories
export async function getCategories(): Promise<Category[]> {
  return db.categories.getAll()
}

export async function getActiveCategories(): Promise<Category[]> {
  return db.categories.getActive()
}

export async function createCategory(data: {
  name: string
  label: string
  description?: string
  color?: string
  icon?: string
}): Promise<Category> {
  const existing = await db.categories.getAll()
  const sortOrder = existing.length > 0 ? (existing[existing.length - 1].sort_order || 0) + 1 : 0

  const category = await db.categories.create({
    name: data.name.toLowerCase().replace(/\s+/g, "-"),
    label: data.label,
    description: data.description,
    color: data.color || "#6b7280",
    icon: data.icon || "folder",
    sort_order: sortOrder,
  })

  revalidatePath("/admin/settings")
  return category
}

export async function updateCategory(id: string, data: Partial<Category> & { isActive?: boolean }): Promise<void> {
  // Convert camelCase to snake_case
  const dbData: Partial<Category> = { ...data }
  if ("isActive" in data) {
    dbData.is_active = data.isActive
    delete (dbData as Record<string, unknown>).isActive
  }
  await db.categories.update(id, dbData)
  revalidatePath("/admin/settings")
}

export async function deleteCategory(id: string): Promise<void> {
  await db.categories.delete(id)
  revalidatePath("/admin/settings")
}

// Tags
export async function getTags(): Promise<Tag[]> {
  return db.tags.getAll()
}

export async function getActiveTags(): Promise<Tag[]> {
  return db.tags.getActive()
}

export async function createTag(data: { name: string; color?: string }): Promise<Tag> {
  const existing = await db.tags.getAll()
  const sortOrder = existing.length > 0 ? (existing[existing.length - 1].sort_order || 0) + 1 : 0

  const tag = await db.tags.create({
    name: data.name,
    color: data.color || "#3b82f6",
    sort_order: sortOrder,
  })

  revalidatePath("/admin/settings")
  return tag
}

export async function updateTag(id: string, data: Partial<Tag> & { isActive?: boolean }): Promise<void> {
  const dbData: Partial<Tag> = { ...data }
  if ("isActive" in data) {
    dbData.is_active = data.isActive
    delete (dbData as Record<string, unknown>).isActive
  }
  await db.tags.update(id, dbData)
  revalidatePath("/admin/settings")
}

export async function deleteTag(id: string): Promise<void> {
  await db.tags.delete(id)
  revalidatePath("/admin/settings")
}

// Questions
export async function getQuestions(): Promise<Question[]> {
  return db.questions.getAll()
}

export async function getActiveQuestions(): Promise<Question[]> {
  return db.questions.getActive()
}

export async function createQuestion(data: {
  questionType: string
  questionText: string
  description?: string
  options?: unknown
  isRequired?: boolean
  minValue?: number
  maxValue?: number
}): Promise<Question> {
  const existing = await db.questions.getAll()
  const sortOrder = existing.length > 0 ? (existing[existing.length - 1].sort_order || 0) + 1 : 0

  const question = await db.questions.create({
    question_type: data.questionType as Question["question_type"],
    question_text: data.questionText,
    description: data.description,
    options: data.options as string[] | null,
    is_required: data.isRequired ?? false,
    min_value: data.minValue,
    max_value: data.maxValue,
    sort_order: sortOrder,
  })

  revalidatePath("/admin/settings")
  return question
}

export async function updateQuestion(
  id: string,
  data: Partial<Question> & {
    isActive?: boolean
    isRequired?: boolean
    questionType?: string
    questionText?: string
    minValue?: number
    maxValue?: number
  },
): Promise<void> {
  const dbData: Partial<Question> = { ...data }

  // Convert all camelCase fields to snake_case
  if ("isActive" in data) {
    dbData.is_active = data.isActive
    delete (dbData as Record<string, unknown>).isActive
  }
  if ("isRequired" in data) {
    dbData.is_required = data.isRequired
    delete (dbData as Record<string, unknown>).isRequired
  }
  if ("questionType" in data) {
    dbData.question_type = data.questionType as Question["question_type"]
    delete (dbData as Record<string, unknown>).questionType
  }
  if ("questionText" in data) {
    dbData.question_text = data.questionText
    delete (dbData as Record<string, unknown>).questionText
  }
  if ("minValue" in data) {
    dbData.min_value = data.minValue
    delete (dbData as Record<string, unknown>).minValue
  }
  if ("maxValue" in data) {
    dbData.max_value = data.maxValue
    delete (dbData as Record<string, unknown>).maxValue
  }

  await db.questions.update(id, dbData)
  revalidatePath("/admin/settings")
}

export async function deleteQuestion(id: string): Promise<void> {
  await db.questions.delete(id)
  revalidatePath("/admin/settings")
}

// Branding Settings
export async function getBrandingSettings(): Promise<BrandingSettings | null> {
  return db.branding.get()
}

export async function updateBrandingSettings(data: Partial<BrandingSettings>): Promise<void> {
  await db.branding.upsert(data)
  revalidatePath("/")
  revalidatePath("/admin/settings")
}

// Notification Settings
export async function getNotificationSettings(): Promise<NotificationSetting[]> {
  return db.notifications.getAll()
}

export async function getNotificationSettingByType(type: string): Promise<NotificationSetting | null> {
  return db.notifications.getByType(type)
}

export async function updateNotificationSettings(
  type: string,
  data: Partial<NotificationSetting> & {
    isEnabled?: boolean
    notifyOnNewFeedback?: boolean
    notifyOnUrgent?: boolean
    notifyOnClarificationResponse?: boolean
    notifyDailyDigest?: boolean
  },
): Promise<void> {
  const dbData: Partial<NotificationSetting> = { ...data }

  // Convert all camelCase fields to snake_case
  if ("isEnabled" in data) {
    dbData.is_enabled = data.isEnabled
    delete (dbData as Record<string, unknown>).isEnabled
  }
  if ("notifyOnNewFeedback" in data) {
    dbData.notify_on_new_feedback = data.notifyOnNewFeedback
    delete (dbData as Record<string, unknown>).notifyOnNewFeedback
  }
  if ("notifyOnUrgent" in data) {
    dbData.notify_on_urgent = data.notifyOnUrgent
    delete (dbData as Record<string, unknown>).notifyOnUrgent
  }
  if ("notifyOnClarificationResponse" in data) {
    dbData.notify_on_clarification_response = data.notifyOnClarificationResponse
    delete (dbData as Record<string, unknown>).notifyOnClarificationResponse
  }
  if ("notifyDailyDigest" in data) {
    dbData.notify_daily_digest = data.notifyDailyDigest
    delete (dbData as Record<string, unknown>).notifyDailyDigest
  }

  await db.notifications.upsert(type, dbData)
  revalidatePath("/admin/settings")
}

// Test Telegram notification
export async function testTelegramNotification(
  botToken: string,
  chatId: string,
): Promise<{ success: boolean; message: string }> {
  if (!botToken?.trim()) {
    return { success: false, message: "Bot token is required. Create a bot via @BotFather on Telegram." }
  }

  if (!chatId?.trim()) {
    return { success: false, message: "Chat ID is required. Send a message to @userinfobot to get your ID." }
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken.trim()}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text: "🔔 *Test Notification*\n\nYour Anonymous Feedback System is now connected to Telegram!",
        parse_mode: "Markdown",
      }),
    })

    const result = await response.json()

    if (result.ok) {
      return { success: true, message: "Test message sent successfully!" }
    } else {
      const errorCode = result.error_code
      const description = result.description || "Unknown error"

      if (errorCode === 400 && description.includes("chat not found")) {
        return {
          success: false,
          message:
            "Chat not found. Make sure you've started a conversation with your bot first, or if using a group, add the bot to the group.",
        }
      }
      if (errorCode === 401) {
        return { success: false, message: "Invalid bot token. Please check your token from @BotFather." }
      }
      if (errorCode === 403) {
        return { success: false, message: "Bot was blocked by the user or removed from the group." }
      }

      return { success: false, message: description }
    }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Connection error" }
  }
}
