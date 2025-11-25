// Anonymity utilities for secure feedback handling

export function generateAccessCode(): string {
  // Generate a 12-character alphanumeric code
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += "-"
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function hashAccessCode(code: string): Promise<string> {
  // In production, use a proper hashing algorithm with salt
  const encoder = new TextEncoder()
  const data = encoder.encode(code.replace(/-/g, ""))
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

type ModerationResult = {
  passed: boolean
  flags: string[]
  score: number
}

export async function moderateContent(text: string): Promise<ModerationResult> {
  const flags: string[] = []
  let score = 100

  // Check for potentially abusive patterns
  const abusivePatterns = [
    /\b(idiot|stupid|dumb|hate|terrible)\b/gi,
    /[A-Z]{10,}/g, // Excessive caps
    /(.)\1{5,}/g, // Character spam
  ]

  const spamPatterns = [
    /\b(buy now|click here|free money|winner)\b/gi,
    /https?:\/\/\S+/gi, // URLs (might be spam)
  ]

  const threatPatterns = [/\b(threat|kill|hurt|violence|attack)\b/gi]

  abusivePatterns.forEach((pattern) => {
    if (pattern.test(text)) {
      flags.push("potentially_abusive")
      score -= 20
    }
  })

  spamPatterns.forEach((pattern) => {
    if (pattern.test(text)) {
      flags.push("potential_spam")
      score -= 30
    }
  })

  threatPatterns.forEach((pattern) => {
    if (pattern.test(text)) {
      flags.push("potential_threat")
      score -= 50
    }
  })

  // Check minimum length
  if (text.length < 20) {
    flags.push("too_short")
    score -= 10
  }

  return {
    passed: score >= 50 && !flags.includes("potential_threat"),
    flags,
    score: Math.max(0, score),
  }
}

export function extractKeywords(text: string): string[] {
  // Simple keyword extraction
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "must",
    "shall",
    "can",
    "need",
    "dare",
    "ought",
    "used",
    "to",
    "of",
    "in",
    "for",
    "on",
    "with",
    "at",
    "by",
    "from",
    "up",
    "about",
    "into",
    "over",
    "after",
    "beneath",
    "under",
    "above",
    "and",
    "but",
    "or",
    "nor",
    "so",
    "yet",
    "both",
    "either",
    "neither",
    "not",
    "only",
    "own",
    "same",
    "than",
    "too",
    "very",
    "just",
    "that",
    "this",
    "these",
    "those",
    "i",
    "me",
    "my",
    "we",
    "our",
    "you",
    "your",
    "he",
    "him",
    "his",
    "she",
    "her",
    "it",
    "its",
    "they",
    "them",
    "their",
    "what",
    "which",
    "who",
    "whom",
    "when",
    "where",
    "why",
    "how",
  ])

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word))

  const wordCount: Record<string, number> = {}
  words.forEach((word) => {
    wordCount[word] = (wordCount[word] || 0) + 1
  })

  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word)
}
