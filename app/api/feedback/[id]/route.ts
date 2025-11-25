import { type NextRequest, NextResponse } from "next/server"
import { getAllFeedback, updateFeedbackStatus, requestClarification } from "@/app/actions/feedback"

function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-api-key")
  const validKey = process.env.FEEDBACK_API_KEY
  if (!validKey) return true
  return apiKey === validKey
}

// GET - Get single feedback by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const feedback = await getAllFeedback()
  const item = feedback.find((f) => f.id === id)

  if (!item) {
    return NextResponse.json({ error: "Feedback not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: item })
}

// PATCH - Update feedback (status, request clarification, etc.)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { action, status, question } = body

    if (action === "update_status" && status) {
      const success = await updateFeedbackStatus(id, status)
      if (!success) {
        return NextResponse.json({ error: "Failed to update status" }, { status: 400 })
      }
      return NextResponse.json({ success: true, message: "Status updated" })
    }

    if (action === "request_clarification" && question) {
      const success = await requestClarification(id, question)
      if (!success) {
        return NextResponse.json({ error: "Failed to request clarification" }, { status: 400 })
      }
      return NextResponse.json({ success: true, message: "Clarification requested" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
