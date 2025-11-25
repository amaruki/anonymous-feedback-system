const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

// Schema for feedback analysis response
const feedbackAnalysisSchema = {
  type: "object",
  properties: {
    suggestedCategory: {
      type: "string",
      description: "The most appropriate category for this feedback",
    },
    suggestedUrgency: {
      type: "string",
      enum: ["low", "medium", "high", "critical"],
      description: "Suggested urgency level based on content",
    },
    sentiment: {
      type: "string",
      enum: ["positive", "neutral", "negative", "mixed"],
      description: "Overall sentiment of the feedback",
    },
    summary: {
      type: "string",
      description: "A brief 1-2 sentence summary of the feedback",
    },
    actionItems: {
      type: "array",
      items: { type: "string" },
      description: "Specific actionable items extracted from the feedback",
    },
    keyTopics: {
      type: "array",
      items: { type: "string" },
      description: "Main topics or themes in the feedback",
    },
    isActionable: {
      type: "boolean",
      description: "Whether this feedback contains actionable suggestions",
    },
    suggestedTags: {
      type: "array",
      items: { type: "string" },
      description: "Suggested tags based on content",
    },
  },
  required: [
    "suggestedCategory",
    "suggestedUrgency",
    "sentiment",
    "summary",
    "actionItems",
    "keyTopics",
    "isActionable",
    "suggestedTags",
  ],
}

// Schema for report generation response
const reportSchema = {
  type: "object",
  properties: {
    executiveSummary: {
      type: "string",
      description: "Executive summary of overall feedback trends",
    },
    keyThemes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          theme: { type: "string" },
          frequency: { type: "number" },
          sentiment: { type: "string" },
        },
        required: ["theme", "frequency", "sentiment"],
      },
      description: "Key themes with frequency and sentiment",
    },
    urgentItems: {
      type: "array",
      items: { type: "string" },
      description: "Items requiring urgent attention",
    },
    recommendations: {
      type: "array",
      items: { type: "string" },
      description: "Specific recommendations for improvement",
    },
    trendAnalysis: {
      type: "string",
      description: "Trend analysis and patterns observed",
    },
  },
  required: ["executiveSummary", "keyThemes", "urgentItems", "recommendations", "trendAnalysis"],
}

export interface FeedbackAnalysis {
  suggestedCategory: string
  suggestedUrgency: "low" | "medium" | "high" | "critical"
  sentiment: "positive" | "neutral" | "negative" | "mixed"
  summary: string
  actionItems: string[]
  keyTopics: string[]
  isActionable: boolean
  suggestedTags: string[]
}

interface ReportAnalysis {
  executiveSummary: string
  keyThemes: Array<{
    theme: string
    frequency: number
    sentiment: string
  }>
  urgentItems: string[]
  recommendations: string[]
  trendAnalysis: string
}

async function callGemini<T>(prompt: string, schema: object): Promise<T | null> {
  if (!GEMINI_API_KEY) {
    console.error("[v0] GEMINI_API_KEY is not configured")
    return null
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("[v0] Gemini API error:", error)
      return null
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      console.error("[v0] No response from Gemini")
      return null
    }

    return JSON.parse(text) as T
  } catch (error) {
    console.error("[v0] Gemini API call failed:", error)
    return null
  }
}

export async function analyzeFeedback(
  subject: string,
  description: string,
  impact?: string,
  suggestedSolution?: string,
  availableCategories?: string[],
  availableTags?: string[],
): Promise<FeedbackAnalysis | null> {
  const categoryList = availableCategories?.length
    ? `Available categories: ${availableCategories.join(", ")}`
    : "Suggest an appropriate category name"

  const tagList = availableTags?.length
    ? `Available tags to choose from: ${availableTags.join(", ")}`
    : "Suggest relevant tags"

  const prompt = `Analyze the following anonymous feedback and provide structured analysis.

${categoryList}
${tagList}

FEEDBACK:
Subject: ${subject}

Description: ${description}

${impact ? `Impact: ${impact}` : ""}

${suggestedSolution ? `Suggested Solution: ${suggestedSolution}` : ""}

Analyze this feedback and provide:
1. The most appropriate category from the available options
2. Suggested urgency level (low, medium, high, critical) based on:
   - Critical: Safety issues, legal concerns, immediate business impact
   - High: Significant employee wellbeing, major process failures
   - Medium: Improvement opportunities, recurring issues
   - Low: General suggestions, minor observations
3. Overall sentiment
4. A brief summary
5. Specific action items (if any)
6. Key topics/themes
7. Whether it's actionable
8. Relevant tags from the available options`

  return callGemini<FeedbackAnalysis>(prompt, feedbackAnalysisSchema)
}

export async function generateFeedbackReport(
  feedbackItems: Array<{
    subject: string
    description: string
    category: string
    urgency: string
    feedbackType: string
    status: string
    createdAt: string
  }>,
): Promise<string | null> {
  if (feedbackItems.length === 0) return null

  const prompt = `Analyze the following collection of anonymous feedback items and generate a comprehensive report.

FEEDBACK ITEMS:
${feedbackItems
  .map(
    (f, i) => `
${i + 1}. [${f.urgency.toUpperCase()}] ${f.category} - ${f.feedbackType}
Subject: ${f.subject}
Description: ${f.description}
Status: ${f.status}
Submitted: ${f.createdAt}
`,
  )
  .join("\n---\n")}

Generate a report that includes:
1. Executive summary of overall feedback trends
2. Key themes with frequency and sentiment
3. Items requiring urgent attention
4. Specific recommendations for improvement
5. Trend analysis and patterns observed`

  const result = await callGemini<ReportAnalysis>(prompt, reportSchema)

  if (!result) return null

  return `# Feedback Analysis Report

## Executive Summary
${result.executiveSummary}

## Key Themes
${result.keyThemes.map((t) => `- **${t.theme}** (${t.frequency} mentions) - ${t.sentiment}`).join("\n")}

## Urgent Items
${result.urgentItems.map((item) => `- ${item}`).join("\n")}

## Recommendations
${result.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join("\n")}

## Trend Analysis
${result.trendAnalysis}
`
}
