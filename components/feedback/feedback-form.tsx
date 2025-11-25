"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { AlertCircle, CheckCircle2, Copy, ArrowRight, ArrowLeft, Loader2 } from "lucide-react"
import { submitFeedback } from "@/app/actions/feedback"
import { getActiveCategories, getActiveTags, getActiveQuestions } from "@/app/actions/config"
import type { Category, Tag, Question } from "@/lib/db/schema"

const URGENCY_LEVELS = [
  {
    value: "low",
    label: "Low",
    description: "General suggestion or observation",
    color: "bg-slate-100 text-slate-700",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Should be addressed within weeks",
    color: "bg-amber-100 text-amber-700",
  },
  { value: "high", label: "High", description: "Needs attention within days", color: "bg-orange-100 text-orange-700" },
  { value: "critical", label: "Critical", description: "Requires immediate action", color: "bg-red-100 text-red-700" },
]

const FEEDBACK_TYPES = [
  { value: "suggestion", label: "Suggestion", icon: "💡" },
  { value: "concern", label: "Concern", icon: "⚠️" },
  { value: "praise", label: "Praise", icon: "🌟" },
  { value: "question", label: "Question", icon: "❓" },
]

type FormData = {
  category: string
  urgency: string
  tags: string[]
  feedbackType: "suggestion" | "concern" | "praise" | "question"
  subject: string
  description: string
  impact: string
  suggestedSolution: string
  allowFollowUp: boolean
  questionResponses: Record<string, { type: string; value: string | number }>
}

const initialFormData: FormData = {
  category: "",
  urgency: "medium",
  tags: [],
  feedbackType: "suggestion",
  subject: "",
  description: "",
  impact: "",
  suggestedSolution: "",
  allowFollowUp: true,
  questionResponses: {},
}

export function FeedbackForm() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [accessCode, setAccessCode] = useState("")
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Dynamic data from database
  const [categories, setCategories] = useState<Category[]>([])
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [questions, setQuestions] = useState<Question[]>([])

  useEffect(() => {
    async function loadFormConfig() {
      try {
        const [cats, tgs, qs] = await Promise.all([getActiveCategories(), getActiveTags(), getActiveQuestions()])
        setCategories(cats)
        setAvailableTags(tgs)
        setQuestions(qs)

        // Initialize question responses with defaults
        const defaultResponses: Record<string, { type: string; value: string | number }> = {}
        qs.forEach((q) => {
          if (q.questionType === "rating") {
            defaultResponses[q.id] = { type: "rating", value: Math.ceil((q.maxValue || 5) / 2) }
          } else {
            defaultResponses[q.id] = { type: q.questionType, value: "" }
          }
        })
        setFormData((prev) => ({ ...prev, questionResponses: defaultResponses }))
      } catch (error) {
        console.error("[v0] Error loading form config:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadFormConfig()
  }, [])

  const totalSteps = questions.length > 0 ? 4 : 3
  const progress = (step / totalSteps) * 100

  const handleTagToggle = (tagName: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagName) ? prev.tags.filter((t) => t !== tagName) : [...prev.tags, tagName],
    }))
  }

  const handleQuestionResponse = (questionId: string, type: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      questionResponses: {
        ...prev.questionResponses,
        [questionId]: { type, value },
      },
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const result = await submitFeedback(formData)
      setAccessCode(result.accessCode)
      setIsSubmitted(true)
    } catch (error) {
      console.error("[v0] Feedback submission error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyAccessCode = () => {
    navigator.clipboard.writeText(accessCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </CardContent>
      </Card>
    )
  }

  if (isSubmitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Feedback Submitted Successfully</h2>
          <p className="text-slate-600 mb-8">
            Your anonymous feedback has been securely transmitted. Save your access code to track updates.
          </p>

          <div className="bg-slate-50 rounded-xl p-6 mb-8">
            <Label className="text-sm text-slate-600 mb-2 block">Your Anonymous Access Code</Label>
            <div className="flex items-center justify-center gap-3">
              <code className="text-2xl font-mono font-bold text-emerald-600 tracking-wider">{accessCode}</code>
              <Button variant="outline" size="sm" onClick={copyAccessCode}>
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              This code is the only way to check your feedback status. We cannot recover it.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => {
                setIsSubmitted(false)
                setFormData(initialFormData)
                setStep(1)
              }}
            >
              Submit Another
            </Button>
            <Button asChild>
              <a href={`/track?code=${accessCode}`}>Track Feedback</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline">
            Step {step} of {totalSteps}
          </Badge>
          <span className="text-sm text-slate-600">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
        <CardTitle className="mt-6">
          {step === 1 && "Categorize Your Feedback"}
          {step === 2 && questions.length > 0 && "Rate Your Experience"}
          {step === 2 && questions.length === 0 && "Describe Your Feedback"}
          {step === 3 && questions.length > 0 && "Describe Your Feedback"}
          {step === 3 && questions.length === 0 && "Review & Submit"}
          {step === 4 && "Review & Submit"}
        </CardTitle>
        <CardDescription>
          {step === 1 && "Help us route your feedback to the right team"}
          {step === 2 && questions.length > 0 && "Quick ratings help us understand the context"}
          {step === 2 && questions.length === 0 && "Provide details to help us take action"}
          {step === 3 && questions.length > 0 && "Provide details to help us take action"}
          {step === 3 && questions.length === 0 && "Verify your submission before sending"}
          {step === 4 && "Verify your submission before sending"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Step 1: Categorization */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData((p) => ({ ...p, category: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || "#6b7280" }} />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Feedback Type *</Label>
              <RadioGroup
                value={formData.feedbackType}
                onValueChange={(v) => setFormData((p) => ({ ...p, feedbackType: v as FormData["feedbackType"] }))}
                className="grid grid-cols-2 gap-3"
              >
                {FEEDBACK_TYPES.map((type) => (
                  <Label
                    key={type.value}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      formData.feedbackType === type.value
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <RadioGroupItem value={type.value} className="sr-only" />
                    <span className="text-xl">{type.icon}</span>
                    <span className="font-medium">{type.label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>Urgency Level</Label>
              <div className="grid grid-cols-2 gap-3">
                {URGENCY_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, urgency: level.value }))}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      formData.urgency === level.value
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <Badge className={level.color}>{level.label}</Badge>
                    <p className="text-xs text-slate-600 mt-2">{level.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {availableTags.length > 0 && (
              <div className="space-y-3">
                <Label>Tags (Select all that apply)</Label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagToggle(tag.name)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        formData.tags.includes(tag.name)
                          ? "text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                      style={{
                        backgroundColor: formData.tags.includes(tag.name) ? tag.color || "#10b981" : undefined,
                      }}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Ratings (if questions exist) */}
        {step === 2 && questions.length > 0 && (
          <div className="space-y-8">
            {questions.map((question) => (
              <div key={question.id} className="space-y-4">
                {question.questionType === "rating" && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>{question.questionText}</Label>
                        {question.description && <p className="text-sm text-slate-500">{question.description}</p>}
                      </div>
                      <span className="text-2xl font-bold text-emerald-600">
                        {formData.questionResponses[question.id]?.value || question.minValue}/{question.maxValue}
                      </span>
                    </div>
                    <Slider
                      value={[Number(formData.questionResponses[question.id]?.value || question.minValue)]}
                      onValueChange={([v]) => handleQuestionResponse(question.id, "rating", v)}
                      max={question.maxValue || 5}
                      min={question.minValue || 1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Poor</span>
                      <span>Excellent</span>
                    </div>
                  </>
                )}

                {question.questionType === "multiple_choice" && (
                  <>
                    <Label>{question.questionText}</Label>
                    {question.description && <p className="text-sm text-slate-500">{question.description}</p>}
                    <Select
                      value={String(formData.questionResponses[question.id]?.value || "")}
                      onValueChange={(v) => handleQuestionResponse(question.id, "multiple_choice", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        {((question.options as { value: string; label: string }[]) || []).map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}

                {question.questionType === "text" && (
                  <>
                    <Label>{question.questionText}</Label>
                    {question.description && <p className="text-sm text-slate-500">{question.description}</p>}
                    <Input
                      value={String(formData.questionResponses[question.id]?.value || "")}
                      onChange={(e) => handleQuestionResponse(question.id, "text", e.target.value)}
                      placeholder="Enter your response"
                    />
                  </>
                )}

                {question.questionType === "textarea" && (
                  <>
                    <Label>{question.questionText}</Label>
                    {question.description && <p className="text-sm text-slate-500">{question.description}</p>}
                    <Textarea
                      value={String(formData.questionResponses[question.id]?.value || "")}
                      onChange={(e) => handleQuestionResponse(question.id, "textarea", e.target.value)}
                      placeholder="Enter your response"
                      rows={3}
                    />
                  </>
                )}
              </div>
            ))}

            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-slate-500 mt-0.5" />
                <div className="text-sm text-slate-600">
                  <p className="font-medium mb-1">Why we ask for ratings</p>
                  <p>Numerical ratings help us identify trends and prioritize improvements.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 or 3: Description */}
        {((step === 2 && questions.length === 0) || (step === 3 && questions.length > 0)) && (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="subject">Subject Line *</Label>
              <Input
                id="subject"
                placeholder="Brief summary of your feedback"
                value={formData.subject}
                onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))}
                maxLength={100}
              />
              <p className="text-xs text-slate-500">{formData.subject.length}/100 characters</p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="description">Detailed Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your feedback in detail. Be specific about situations, behaviors, or processes."
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                rows={5}
                maxLength={2000}
              />
              <p className="text-xs text-slate-500">{formData.description.length}/2000 characters</p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="impact">Impact (Optional)</Label>
              <Textarea
                id="impact"
                placeholder="How does this affect you, your team, or the organization?"
                value={formData.impact}
                onChange={(e) => setFormData((p) => ({ ...p, impact: e.target.value }))}
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="solution">Suggested Solution (Optional)</Label>
              <Textarea
                id="solution"
                placeholder="If you have ideas for improvement, share them here"
                value={formData.suggestedSolution}
                onChange={(e) => setFormData((p) => ({ ...p, suggestedSolution: e.target.value }))}
                rows={3}
                maxLength={500}
              />
            </div>
          </div>
        )}

        {/* Final Step: Review */}
        {((step === 3 && questions.length === 0) || step === 4) && (
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Category</span>
                <span className="font-medium">
                  {categories.find((c) => c.name === formData.category)?.label || formData.category}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Type</span>
                <Badge variant="secondary" className="capitalize">
                  {formData.feedbackType}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Urgency</span>
                <Badge className={URGENCY_LEVELS.find((u) => u.value === formData.urgency)?.color}>
                  {formData.urgency}
                </Badge>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-sm text-slate-600">Tags</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-slate-900">{formData.subject}</h4>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{formData.description}</p>
              {formData.impact && (
                <div className="mt-4">
                  <span className="text-xs font-medium text-slate-500 uppercase">Impact</span>
                  <p className="text-sm text-slate-600 mt-1">{formData.impact}</p>
                </div>
              )}
              {formData.suggestedSolution && (
                <div className="mt-4">
                  <span className="text-xs font-medium text-slate-500 uppercase">Suggested Solution</span>
                  <p className="text-sm text-slate-600 mt-1">{formData.suggestedSolution}</p>
                </div>
              )}
            </div>

            <div className="border-t pt-6">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="followup"
                  checked={formData.allowFollowUp}
                  onCheckedChange={(checked) => setFormData((p) => ({ ...p, allowFollowUp: !!checked }))}
                />
                <div>
                  <Label htmlFor="followup" className="cursor-pointer">
                    Allow anonymous follow-ups
                  </Label>
                  <p className="text-sm text-slate-500">
                    Admins can request clarification through your access code without knowing your identity
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 1}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {step < totalSteps ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={
                (step === 1 && !formData.category) ||
                (((step === 2 && questions.length === 0) || (step === 3 && questions.length > 0)) &&
                  (!formData.subject || !formData.description))
              }
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Feedback"
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
