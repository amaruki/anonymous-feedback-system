import { db } from "@/lib/db"

export type NotificationEvent = "new_feedback" | "urgent_feedback" | "clarification_response"

type NotificationData = {
  id?: string
  feedbackId?: string
  subject?: string
  category?: string
  urgency?: string
  feedbackType?: string
  description?: string
}

export async function sendNotification(eventType: NotificationEvent, data: NotificationData) {
  try {
    const settings = await db.notifications.getAll()

    for (const setting of settings) {
      if (!setting.is_enabled) continue

      const shouldNotify =
        (eventType === "new_feedback" && setting.notify_on_new_feedback) ||
        (eventType === "urgent_feedback" && setting.notify_on_urgent) ||
        (eventType === "clarification_response" && setting.notify_on_clarification_response)

      if (!shouldNotify) continue

      if (eventType === "new_feedback" && data.urgency && ["high", "critical"].includes(data.urgency)) {
        if (setting.notify_on_urgent) {
          await dispatchNotification(setting.notification_type, setting.config, "urgent_feedback", data)
        }
      }

      await dispatchNotification(setting.notification_type, setting.config, eventType, data)
    }
  } catch (error) {
    console.error("[v0] Error sending notification:", error)
  }
}

async function dispatchNotification(
  type: string,
  config: unknown,
  eventType: NotificationEvent,
  data: NotificationData,
) {
  const cfg = config as Record<string, string>

  switch (type) {
    case "telegram":
      await sendTelegramNotification(cfg.bot_token, cfg.chat_id, eventType, data)
      break
    case "slack":
      await sendSlackNotification(cfg.webhook_url, eventType, data)
      break
    case "webhook":
      await sendWebhookNotification(cfg.url, eventType, data)
      break
    case "email":
      console.log("[v0] Email notification:", eventType, data)
      break
  }
}

async function sendTelegramNotification(
  botToken: string,
  chatId: string,
  eventType: NotificationEvent,
  data: NotificationData,
) {
  if (!botToken || !chatId) return

  const message = formatTelegramMessage(eventType, data)

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    })
  } catch (error) {
    console.error("[v0] Telegram notification failed:", error)
  }
}

function formatTelegramMessage(eventType: NotificationEvent, data: NotificationData): string {
  const urgencyEmoji: Record<string, string> = {
    low: "🟢",
    medium: "🟡",
    high: "🟠",
    critical: "🔴",
  }

  const typeEmoji: Record<string, string> = {
    suggestion: "💡",
    concern: "⚠️",
    praise: "⭐",
    question: "❓",
  }

  switch (eventType) {
    case "new_feedback":
      return `📬 *New Feedback Received*

${typeEmoji[data.feedbackType || "suggestion"] || "📝"} *Type:* ${data.feedbackType || "Unknown"}
${urgencyEmoji[data.urgency || "medium"]} *Urgency:* ${data.urgency || "Medium"}
📁 *Category:* ${data.category || "Uncategorized"}

*Subject:* ${data.subject || "No subject"}

[View in Dashboard →](${process.env.NEXT_PUBLIC_APP_URL || ""}/admin)`

    case "urgent_feedback":
      return `🚨 *URGENT Feedback Alert*

${urgencyEmoji[data.urgency || "high"]} *Priority:* ${data.urgency?.toUpperCase() || "HIGH"}
${typeEmoji[data.feedbackType || "concern"] || "⚠️"} *Type:* ${data.feedbackType || "Unknown"}
📁 *Category:* ${data.category || "Uncategorized"}

*Subject:* ${data.subject || "No subject"}

⚡ *Requires immediate attention*

[View Now →](${process.env.NEXT_PUBLIC_APP_URL || ""}/admin)`

    case "clarification_response":
      return `💬 *Clarification Response Received*

*Subject:* ${data.subject || "No subject"}

A submitter has responded to a follow-up question.

[View Response →](${process.env.NEXT_PUBLIC_APP_URL || ""}/admin)`

    default:
      return `📢 *Feedback System Notification*\n\n${JSON.stringify(data, null, 2)}`
  }
}

async function sendWebhookNotification(
  endpoint: string | undefined,
  eventType: NotificationEvent,
  data: NotificationData,
) {
  if (!endpoint) return

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Event-Type": eventType,
      },
      body: JSON.stringify({
        event: eventType,
        timestamp: new Date().toISOString(),
        data,
      }),
    })
  } catch (error) {
    console.error("[v0] Webhook notification failed:", error)
  }
}

async function sendSlackNotification(
  webhookUrl: string | undefined,
  eventType: NotificationEvent,
  data: NotificationData,
) {
  if (!webhookUrl) return

  const colorMap: Record<string, string> = {
    new_feedback: "#10b981",
    urgent_feedback: "#ef4444",
    clarification_response: "#3b82f6",
  }

  const message = {
    attachments: [
      {
        color: colorMap[eventType] || "#6b7280",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${eventType.replace("_", " ").toUpperCase()}*`,
            },
          },
          {
            type: "section",
            fields: [
              { type: "mrkdwn", text: `*Subject:* ${data.subject || "N/A"}` },
              { type: "mrkdwn", text: `*Category:* ${data.category || "N/A"}` },
              { type: "mrkdwn", text: `*Urgency:* ${data.urgency || "N/A"}` },
              { type: "mrkdwn", text: `*Type:* ${data.feedbackType || "N/A"}` },
            ],
          },
        ],
      },
    ],
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    })
  } catch (error) {
    console.error("[v0] Slack notification failed:", error)
  }
}
