import { GoogleGenAI } from "@google/genai"
import { z } from "zod"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

// --- Zod Schemas ---

const feedbackAnalysisSchema = z.object({
  suggestedCategory: z.string().describe("The most appropriate category for this feedback"),
  suggestedUrgency: z
    .enum(["low", "medium", "high", "critical"])
    .describe("Suggested urgency level based on content"),
  sentiment: z
    .enum(["positive", "neutral", "negative", "mixed"])
    .describe("Overall sentiment of the feedback"),
  summary: z.string().describe("A brief 1-2 sentence summary of the feedback"),
  actionItems: z.array(z.string()).describe("Specific actionable items extracted from the feedback"),
  keyTopics: z.array(z.string()).describe("Main topics or themes in the feedback"),
  isActionable: z.boolean().describe("Whether this feedback contains actionable suggestions"),
  suggestedTags: z.array(z.string()).describe("Suggested tags based on content"),
})

const reportSchema = z.object({
  executiveSummary: z.string().describe("Executive summary of overall feedback trends"),
  keyThemes: z
    .array(
      z.object({
        theme: z.string(),
        frequency: z.number(),
        sentiment: z.string(),
      }),
    )
    .describe("Key themes with frequency and sentiment"),
  urgentItems: z.array(z.string()).describe("Items requiring urgent attention"),
  recommendations: z.array(z.string()).describe("Specific recommendations for improvement"),
  trendAnalysis: z.string().describe("Trend analysis and patterns observed"),
})

export type FeedbackAnalysis = z.infer<typeof feedbackAnalysisSchema>
type ReportAnalysis = z.infer<typeof reportSchema>

// --- Helpers ---

/**
 * Cleans JSON string from Markdown code blocks often returned by LLMs
 */
function cleanJsonString(text: string): string {
  const pattern = /^```json\s*(.*?)\s*```$/
  const match = text.match(pattern)
  return match ? match[1] : text
}

/**
 * Converts Zod schema to Google's expected JSON Schema format.
 * Note: For production apps, consider using the 'zod-to-json-schema' package.
 */
function zodToJsonSchema(zodSchema: z.ZodType): any {
  if (zodSchema === feedbackAnalysisSchema) {
    return {
      type: "object",
      properties: {
        suggestedCategory: { type: "string", description: "The most appropriate category" },
        suggestedUrgency: { type: "string", enum: ["low", "medium", "high", "critical"] },
        sentiment: { type: "string", enum: ["positive", "neutral", "negative", "mixed"] },
        summary: { type: "string" },
        actionItems: { type: "array", items: { type: "string" } },
        keyTopics: { type: "array", items: { type: "string" } },
        isActionable: { type: "boolean" },
        suggestedTags: { type: "array", items: { type: "string" } },
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
  } else {
    return {
      type: "object",
      properties: {
        executiveSummary: { type: "string" },
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
        },
        urgentItems: { type: "array", items: { type: "string" } },
        recommendations: { type: "array", items: { type: "string" } },
        trendAnalysis: { type: "string" },
      },
      required: ["executiveSummary", "keyThemes", "urgentItems", "recommendations", "trendAnalysis"],
    }
  }
}

async function callGemini<T extends z.ZodType>(
  prompt: string,
  zodSchema: T,
): Promise<z.infer<T> | null> {
  if (!GEMINI_API_KEY) {
    console.error("[AI] GEMINI_API_KEY is not configured")
    return null
  }

  try {
    const client = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
    
    const result = await client.models.generateContent({
      model: "gemini-2.5-flash", // Ensure you have access to this model, otherwise use "gemini-1.5-flash"
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: zodToJsonSchema(zodSchema),
      },
    })

    const rawText = result.text || result.candidates?.[0]?.content?.parts?.[0]?.text

    if (!rawText) {
      console.error("[AI] No response text from Gemini")
      return null
    }

    // Clean potential markdown backticks
    const cleanedJson = cleanJsonString(rawText)
    const parsed = JSON.parse(cleanedJson)

    // Validate with Zod
    return zodSchema.parse(parsed)
  } catch (error) {
    console.error("[AI] Gemini API call failed:", error)
    return null
  }
}

// --- Exported Functions ---

export async function analyzeFeedback(
  subject: string,
  description: string,
  impact?: string,
  suggestedSolution?: string,
  availableCategories?: string[],
  availableTags?: string[],
): Promise<FeedbackAnalysis | null> {
  const categoryList = availableCategories?.length
    ? `Pick one category from this list: ${JSON.stringify(availableCategories)}`
    : "Suggest a short, professional category name."

  const tagList = availableTags?.length
    ? `Select relevant tags from this list: ${JSON.stringify(availableTags)}`
    : "Suggest relevant tags."

  const prompt = `Analyze the following feedback.

${categoryList}
${tagList}

FEEDBACK DATA:
Subject: ${subject}
Description: ${description}
${impact ? `Impact: ${impact}` : ""}
${suggestedSolution ? `Suggested Solution: ${suggestedSolution}` : ""}
`

  return callGemini(prompt, feedbackAnalysisSchema)
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

  const prompt = `Analyze these feedback items and generate a report.

ITEMS:
${feedbackItems
  .map(
    (f, i) =>
      `${i + 1}. [${f.urgency}] ${f.category}: ${f.subject} - ${f.description}`,
  )
  .join("\n")}
`

  const result = await callGemini(prompt, reportSchema)

  if (!result) return null

  return `# Feedback Analysis Report

## Executive Summary
${result.executiveSummary}

## Key Themes
${result.keyThemes
  .map((t) => `- **${t.theme}** (${t.frequency} mentions) - ${t.sentiment}`)
  .join("\n")}

## Urgent Items
${result.urgentItems.map((item) => `- ${item}`).join("\n")}

## Recommendations
${result.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join("\n")}

## Trend Analysis
${result.trendAnalysis}
`
}
