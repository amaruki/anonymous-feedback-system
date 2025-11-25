import { generateObject } from "ai"
import { z } from "zod"

const FeedbackAnalysisSchema = z.object({
  suggestedCategory: z.string().describe("The most appropriate category for this feedback"),
  suggestedUrgency: z.enum(["low", "medium", "high", "critical"]).describe("Suggested urgency level based on content"),
  sentiment: z.enum(["positive", "neutral", "negative", "mixed"]).describe("Overall sentiment of the feedback"),
  summary: z.string().describe("A brief 1-2 sentence summary of the feedback"),
  actionItems: z.array(z.string()).describe("Specific actionable items extracted from the feedback"),
  keyTopics: z.array(z.string()).describe("Main topics or themes in the feedback"),
  isActionable: z.boolean().describe("Whether this feedback contains actionable suggestions"),
  suggestedTags: z.array(z.string()).describe("Suggested tags based on content"),
})

export type FeedbackAnalysis = z.infer<typeof FeedbackAnalysisSchema>

export async function analyzeFeedback(
  subject: string,
  description: string,
  impact?: string,
  suggestedSolution?: string,
  availableCategories?: string[],
  availableTags?: string[],
): Promise<FeedbackAnalysis | null> {
  try {
    const categoryList = availableCategories?.length
      ? `Available categories: ${availableCategories.join(", ")}`
      : "Suggest an appropriate category name"

    const tagList = availableTags?.length
      ? `Available tags to choose from: ${availableTags.join(", ")}`
      : "Suggest relevant tags"

    const { object } = await generateObject({
      model: "openai/gpt-4o-mini",
      schema: FeedbackAnalysisSchema,
      prompt: `Analyze the following anonymous feedback and provide structured analysis.

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
8. Relevant tags from the available options`,
    })

    return object
  } catch (error) {
    console.error("[v0] AI categorization error:", error)
    return null
  }
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

  try {
    const { object } = await generateObject({
      model: "openai/gpt-4o-mini",
      schema: z.object({
        executiveSummary: z.string(),
        keyThemes: z.array(
          z.object({
            theme: z.string(),
            frequency: z.number(),
            sentiment: z.string(),
          }),
        ),
        urgentItems: z.array(z.string()),
        recommendations: z.array(z.string()),
        trendAnalysis: z.string(),
      }),
      prompt: `Analyze the following collection of anonymous feedback items and generate a comprehensive report.

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
5. Trend analysis and patterns observed`,
    })

    return `# Feedback Analysis Report

## Executive Summary
${object.executiveSummary}

## Key Themes
${object.keyThemes.map((t) => `- **${t.theme}** (${t.frequency} mentions) - ${t.sentiment}`).join("\n")}

## Urgent Items
${object.urgentItems.map((item) => `- ${item}`).join("\n")}

## Recommendations
${object.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join("\n")}

## Trend Analysis
${object.trendAnalysis}
`
  } catch (error) {
    console.error("[v0] Report generation error:", error)
    return null
  }
}
