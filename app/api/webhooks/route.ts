import { type NextRequest, NextResponse } from "next/server"

export type WebhookEvent = {
  type: "feedback.submitted" | "feedback.updated" | "clarification.requested" | "clarification.responded"
  timestamp: string
  data: Record<string, unknown>
}

// Webhook configuration storage (in production, use database)
const webhookEndpoints: string[] = []

// Register a new webhook endpoint
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key")
  if (apiKey !== process.env.FEEDBACK_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { url } = await request.json()

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Invalid webhook URL" }, { status: 400 })
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    if (!webhookEndpoints.includes(url)) {
      webhookEndpoints.push(url)
    }

    return NextResponse.json({
      success: true,
      message: "Webhook registered",
      webhooks: webhookEndpoints,
    })
  } catch (error) {
    console.error("[v0] Webhook registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Get registered webhooks
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key")
  if (apiKey !== process.env.FEEDBACK_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json({
    success: true,
    webhooks: webhookEndpoints,
  })
}

// Helper function to trigger webhooks (called from other parts of the app)
export async function triggerWebhook(event: WebhookEvent) {
  const promises = webhookEndpoints.map(async (url) => {
    try {
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Event": event.type,
        },
        body: JSON.stringify(event),
      })
    } catch (error) {
      console.error(`[v0] Failed to send webhook to ${url}:`, error)
    }
  })

  await Promise.allSettled(promises)
}
