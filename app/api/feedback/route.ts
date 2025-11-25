import { type NextRequest, NextResponse } from "next/server"
import { submitFeedback, getAllFeedback, getAnalytics } from "@/app/actions/feedback"

// API Key validation helper
function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-api-key")
  const validKey = process.env.FEEDBACK_API_KEY

  // In production, always require API key
  if (!validKey) {
    console.warn("[v0] FEEDBACK_API_KEY not set - API access is open")
    return true // Allow access in development
  }

  return apiKey === validKey
}

// GET - Retrieve feedback (with optional filters)
export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") || "list"

  try {
    if (type === "analytics") {
      const analytics = await getAnalytics()
      return NextResponse.json({ success: true, data: analytics })
    }

    const feedback = await getAllFeedback()

    // Apply filters
    const category = searchParams.get("category")
    const status = searchParams.get("status")
    const urgency = searchParams.get("urgency")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let filtered = feedback

    if (category) {
      filtered = filtered.filter((f) => f.category === category)
    }
    if (status) {
      filtered = filtered.filter((f) => f.status === status)
    }
    if (urgency) {
      filtered = filtered.filter((f) => f.urgency === urgency)
    }

    const paginated = filtered.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: paginated,
      meta: {
        total: filtered.length,
        limit,
        offset,
        hasMore: offset + limit < filtered.length,
      },
    })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Submit new feedback via API
export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ["category", "feedbackType", "subject", "description"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Set defaults for optional fields
    const feedbackData = {
      category: body.category,
      urgency: body.urgency || "medium",
      tags: body.tags || [],
      overallRating: body.overallRating || 3,
      satisfactionRating: body.satisfactionRating || 3,
      supportRating: body.supportRating || 3,
      feedbackType: body.feedbackType,
      subject: body.subject,
      description: body.description,
      impact: body.impact || "",
      suggestedSolution: body.suggestedSolution || "",
      allowFollowUp: body.allowFollowUp !== false,
    }

    const result = await submitFeedback(feedbackData)

    return NextResponse.json(
      {
        success: true,
        data: {
          accessCode: result.accessCode,
          id: result.id,
          trackingUrl: `/track?code=${result.accessCode}`,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
