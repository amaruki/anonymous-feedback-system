"use server"

import { db } from "@/lib/db"
import type { Category, Tag, Question, BrandingSettings, NotificationSetting } from "@/lib/db"
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
  const existing = await getCategories()
  const sortOrder = existing.length > 0 ? (existing[existing.length - 1].sortOrder || 0) + 1 : 0

  const category = await db.categories.create({
    name: data.name.toLowerCase().replace(/\s+/g, "-"),
    label: data.label,
    description: data.description,
    color: data.color || "#6b7280",
    icon: data.icon || "folder",
    sortOrder,
    isActive: true,
  })

  revalidatePath("/admin/settings")
  return category
}

export async function updateCategory(id: string, data: Partial<Category>): Promise<void> {
  await db.categories.update(id, data)
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
  const existing = await getTags()
  const sortOrder = existing.length > 0 ? (existing[existing.length - 1].sortOrder || 0) + 1 : 0

  const tag = await db.tags.create({
    name: data.name,
    color: data.color || "#3b82f6",
    sortOrder,
    isActive: true,
  })

  revalidatePath("/admin/settings")
  return tag
}

export async function updateTag(id: string, data: Partial<Tag>): Promise<void> {
  await db.tags.update(id, data)
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
  questionText: string
  questionType: Question["questionType"]
  options?: string
  isRequired?: boolean
  minValue?: number
  maxValue?: number
  placeholder?: string
}): Promise<Question> {
  const existing = await getQuestions()
  const sortOrder = existing.length > 0 ? (existing[existing.length - 1].sortOrder || 0) + 1 : 0

  const question = await db.questions.create({
    questionText: data.questionText,
    questionType: data.questionType,
    options: data.options,
    isRequired: data.isRequired ?? false,
    minValue: data.minValue,
    maxValue: data.maxValue,
    placeholder: data.placeholder,
    sortOrder,
    isActive: true,
  })

  revalidatePath("/admin/settings")
  return question
}

export async function updateQuestion(id: string, data: Partial<Question>): Promise<void> {
  await db.questions.update(id, data)
  revalidatePath("/admin/settings")
}

export async function deleteQuestion(id: string): Promise<void> {
  await db.questions.delete(id)
  revalidatePath("/admin/settings")
}

// Branding
export async function getBrandingSettings(): Promise<BrandingSettings | null> {
  return db.branding.get()
}

export async function updateBrandingSettings(data: Partial<BrandingSettings>): Promise<BrandingSettings> {
  const branding = await db.branding.upsert(data)
  revalidatePath("/")
  revalidatePath("/admin/settings")
  return branding
}

// Notifications
export async function getNotificationSettings(): Promise<NotificationSetting[]> {
  return db.notifications.getAll()
}

export async function updateNotificationSettings(
  type: NotificationSetting["notificationType"],
  data: Partial<NotificationSetting>,
): Promise<void> {
  await db.notifications.upsert({
    notificationType: type,
    ...data,
  })
  revalidatePath("/admin/settings")
}

// Test Telegram notification
export async function testTelegramNotification(
  botToken: string,
  chatId: string,
): Promise<{ success: boolean; message: string }> {
  if (!botToken || !botToken.trim()) {
    return { success: false, message: "Bot token is required. Get one from @BotFather on Telegram." }
  }

  if (!chatId || !chatId.trim()) {
    return {
      success: false,
      message:
        "Chat ID is required. Send a message to your bot first, then use @userinfobot or check the Telegram API to get your chat ID.",
    }
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken.trim()}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text: "🔔 Test notification from Anonymous Feedback System\n\nYour Telegram integration is working correctly!",
        parse_mode: "HTML",
      }),
    })

    const result = await response.json()

    if (!result.ok) {
      if (result.description?.includes("chat not found")) {
        return {
          success: false,
          message:
            "Chat not found. Make sure you've started a conversation with the bot first by sending /start to it.",
        }
      }
      if (result.description?.includes("bot was blocked")) {
        return { success: false, message: "The bot was blocked by the user. Please unblock the bot and try again." }
      }
      if (result.description?.includes("Unauthorized")) {
        return { success: false, message: "Invalid bot token. Please check your bot token from @BotFather." }
      }
      return { success: false, message: result.description || "Failed to send test message" }
    }

    return { success: true, message: "Test notification sent successfully!" }
  } catch (error) {
    console.error("Telegram test error:", error)
    return { success: false, message: "Failed to connect to Telegram API. Please check your network connection." }
  }
}
