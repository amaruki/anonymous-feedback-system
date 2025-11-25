"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Shield,
  Bell,
  Webhook,
  Code,
  Copy,
  CheckCircle2,
  Key,
  Mail,
  Palette,
  Tags,
  FolderOpen,
  HelpCircle,
  Plus,
  Trash2,
  Edit,
  Loader2,
  Send,
  GripVertical,
} from "lucide-react"
import Link from "next/link"
import {
  getCategories,
  getTags,
  getQuestions,
  getBrandingSettings,
  getNotificationSettings,
  createCategory,
  updateCategory,
  deleteCategory,
  createTag,
  updateTag,
  deleteTag,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  updateBrandingSettings,
  updateNotificationSettings,
  testTelegramNotification,
} from "@/app/actions/config"
type Category = {
  id: string
  name: string
  label: string
  description: string | null
  color: string
  icon: string
  is_active: boolean
  sort_order: number
}

type Tag = {
  id: string
  name: string
  color: string
  is_active: boolean
  sort_order: number
}

type Question = {
  id: string
  question_type: "rating" | "multiple_choice" | "text" | "textarea"
  question_text: string
  description: string | null
  options: string[] | null
  is_required: boolean
  is_active: boolean
  sort_order: number
  min_value: number | null
  max_value: number | null
}

type BrandingSettings = {
  id?: string
  site_name: string
  site_description: string | null
  logo_url: string | null
  primary_color: string
  secondary_color: string
  accent_color: string
  trust_badge_1_title: string
  trust_badge_1_description: string | null
  trust_badge_2_title: string
  trust_badge_2_description: string | null
  trust_badge_3_title: string
  trust_badge_3_description: string | null
  customCss?: string // Added for custom CSS
}

type NotificationSetting = {
  id: string
  notification_type: "email" | "slack" | "telegram" | "webhook"
  is_enabled: boolean
  config: Record<string, unknown>
  notify_on_new_feedback: boolean
  notify_on_urgent: boolean
  notify_on_clarification_response: boolean
  notify_daily_digest: boolean
}

const ICON_OPTIONS = [
  "folder",
  "building",
  "users",
  "settings",
  "heart",
  "dollar-sign",
  "shield",
  "briefcase",
  "globe",
  "star",
]

const COLOR_OPTIONS = [
  "#10b981",
  "#6366f1",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6b7280",
]

export function AdminSettings() {
  const [copied, setCopied] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Data state
  const [categoriesList, setCategoriesList] = useState<Category[]>([])
  const [tagsList, setTagsList] = useState<Tag[]>([])
  const [questionsList, setQuestionsList] = useState<Question[]>([])
  const [branding, setBranding] = useState<BrandingSettings | null>(null)
  const [notifications, setNotifications] = useState<NotificationSetting[]>([])

  // Dialog state
  const [categoryDialog, setCategoryDialog] = useState<{ open: boolean; editing?: Category }>({ open: false })
  const [tagDialog, setTagDialog] = useState<{ open: boolean; editing?: Tag }>({ open: false })
  const [questionDialog, setQuestionDialog] = useState<{ open: boolean; editing?: Question }>({ open: false })

  // Form state
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    label: "",
    description: "",
    color: "#6b7280",
    icon: "folder",
  })
  const [tagForm, setTagForm] = useState({ name: "", color: "#3b82f6" })
  const [questionForm, setQuestionForm] = useState({
    questionType: "rating",
    questionText: "",
    description: "",
    isRequired: false,
    minValue: 1,
    maxValue: 5,
    options: [] as { value: string; label: string }[],
  })

  // Telegram state
  const [telegramConfig, setTelegramConfig] = useState({ botToken: "", chatId: "" })
  const [telegramTesting, setTelegramTesting] = useState(false)
  const [telegramTestResult, setTelegramTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [cats, tgs, qs, brand, notifs] = await Promise.all([
        getCategories(),
        getTags(),
        getQuestions(),
        getBrandingSettings(),
        getNotificationSettings(),
      ])
      setCategoriesList(cats)
      setTagsList(tgs)
      setQuestionsList(qs)
      setBranding(brand)
      setNotifications(notifs)

      // Load telegram config
      const telegramSetting = notifs.find((n) => n.notification_type === "telegram")
      if (telegramSetting?.config) {
        const config = telegramSetting.config as { bot_token?: string; chat_id?: string }
        setTelegramConfig({
          botToken: config.bot_token || "",
          chatId: config.chat_id || "",
        })
      }
    } catch (error) {
      console.error("[v0] Error loading settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  // Category handlers
  const handleSaveCategory = async () => {
    setIsSaving(true)
    try {
      if (categoryDialog.editing) {
        await updateCategory(categoryDialog.editing.id, {
          label: categoryForm.label,
          description: categoryForm.description,
          color: categoryForm.color,
          icon: categoryForm.icon,
        })
      } else {
        await createCategory(categoryForm)
      }
      setCategoryDialog({ open: false })
      setCategoryForm({ name: "", label: "", description: "", color: "#6b7280", icon: "folder" })
      loadData()
    } catch (error) {
      console.error("[v0] Error saving category:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return
    try {
      await deleteCategory(id)
      loadData()
    } catch (error) {
      console.error("[v0] Error deleting category:", error)
    }
  }

  const handleToggleCategory = async (category: Category) => {
    try {
      await updateCategory(category.id, { is_active: !category.is_active })
      loadData()
    } catch (error) {
      console.error("[v0] Error toggling category:", error)
    }
  }

  // Tag handlers
  const handleSaveTag = async () => {
    setIsSaving(true)
    try {
      if (tagDialog.editing) {
        await updateTag(tagDialog.editing.id, { name: tagForm.name, color: tagForm.color })
      } else {
        await createTag(tagForm)
      }
      setTagDialog({ open: false })
      setTagForm({ name: "", color: "#3b82f6" })
      loadData()
    } catch (error) {
      console.error("[v0] Error saving tag:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTag = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tag?")) return
    try {
      await deleteTag(id)
      loadData()
    } catch (error) {
      console.error("[v0] Error deleting tag:", error)
    }
  }

  const handleToggleTag = async (tag: Tag) => {
    try {
      await updateTag(tag.id, { is_active: !tag.is_active })
      loadData()
    } catch (error) {
      console.error("[v0] Error toggling tag:", error)
    }
  }

  // Question handlers
  const handleSaveQuestion = async () => {
    setIsSaving(true)
    try {
      const data = {
        question_type: questionForm.questionType,
        question_text: questionForm.questionText,
        description: questionForm.description,
        is_required: questionForm.isRequired,
        min_value: questionForm.questionType === "rating" ? questionForm.minValue : undefined,
        max_value: questionForm.questionType === "rating" ? questionForm.maxValue : undefined,
        options: questionForm.questionType === "multiple_choice" ? questionForm.options : undefined,
      }

      if (questionDialog.editing) {
        await updateQuestion(questionDialog.editing.id, data)
      } else {
        await createQuestion(data)
      }
      setQuestionDialog({ open: false })
      setQuestionForm({
        questionType: "rating",
        questionText: "",
        description: "",
        isRequired: false,
        minValue: 1,
        maxValue: 5,
        options: [],
      })
      loadData()
    } catch (error) {
      console.error("[v0] Error saving question:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return
    try {
      await deleteQuestion(id)
      loadData()
    } catch (error) {
      console.error("[v0] Error deleting question:", error)
    }
  }

  const handleToggleQuestion = async (question: Question) => {
    try {
      await updateQuestion(question.id, { is_active: !question.is_active })
      loadData()
    } catch (error) {
      console.error("[v0] Error toggling question:", error)
    }
  }

  // Branding handlers
  const handleSaveBranding = async (field: keyof BrandingSettings, value: any) => {
    try {
      await updateBrandingSettings({ [field]: value })
      loadData()
    } catch (error) {
      console.error("[v0] Error saving branding:", error)
    }
  }

  // Telegram handlers
  const handleSaveTelegram = async () => {
    setIsSaving(true)
    try {
      await updateNotificationSettings("telegram", {
        config: { bot_token: telegramConfig.botToken, chat_id: telegramConfig.chatId },
        is_enabled: true,
      })
      loadData()
    } catch (error) {
      console.error("[v0] Error saving telegram settings:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestTelegram = async () => {
    setTelegramTesting(true)
    setTelegramTestResult(null)
    try {
      const result = await testTelegramNotification(telegramConfig.botToken, telegramConfig.chatId)
      setTelegramTestResult(result)
    } catch (error) {
      setTelegramTestResult({ success: false, message: "Connection error" })
    } finally {
      setTelegramTesting(false)
    }
  }

  const handleToggleNotification = async (type: string, enabled: boolean) => {
    try {
      await updateNotificationSettings(type, { is_enabled: enabled })
      loadData()
    } catch (error) {
      console.error("[v0] Error toggling notification:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  const telegramSetting = notifications.find((n) => n.notification_type === "telegram")
  const slackSetting = notifications.find((n) => n.notification_type === "slack")
  const emailSetting = notifications.find((n) => n.notification_type === "email")
  const webhookSetting = notifications.find((n) => n.notification_type === "webhook")

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-slate-600 hover:text-slate-900">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Shield className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h1 className="font-semibold text-slate-900">Settings</h1>
                  <p className="text-xs text-slate-500">Configure your feedback system</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList className="bg-white border flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="branding" className="gap-2">
              <Palette className="w-4 h-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="tags" className="gap-2">
              <Tags className="w-4 h-4" />
              Tags
            </TabsTrigger>
            <TabsTrigger value="questions" className="gap-2">
              <HelpCircle className="w-4 h-4" />
              Questions
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Code className="w-4 h-4" />
              API
            </TabsTrigger>
          </TabsList>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Landing Page Branding
                </CardTitle>
                <CardDescription>Customize the appearance of your feedback portal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      defaultValue={branding?.site_name || ""}
                      onBlur={(e) => handleSaveBranding("site_name", e.target.value)}
                      placeholder="Anonymous Feedback Portal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">Logo URL</Label>
                    <Input
                      id="logoUrl"
                      defaultValue={branding?.logo_url || ""}
                      onBlur={(e) => handleSaveBranding("logo_url", e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Textarea
                    id="siteDescription"
                    defaultValue={branding?.site_description || ""}
                    onBlur={(e) => handleSaveBranding("site_description", e.target.value)}
                    placeholder="Share your thoughts openly and honestly..."
                    rows={3}
                  />
                </div>

                <Separator />

                <div>
                  <Label className="mb-3 block">Brand Colors</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-slate-600">Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={branding?.primary_color || "#10b981"}
                          onChange={(e) => handleSaveBranding("primary_color", e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={branding?.primary_color || "#10b981"}
                          onChange={(e) => handleSaveBranding("primary_color", e.target.value)}
                          className="flex-1 font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-slate-600">Secondary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={branding?.secondary_color || "#6366f1"}
                          onChange={(e) => handleSaveBranding("secondary_color", e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={branding?.secondary_color || "#6366f1"}
                          onChange={(e) => handleSaveBranding("secondary_color", e.target.value)}
                          className="flex-1 font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-slate-600">Accent Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={branding?.accent_color || "#f59e0b"}
                          onChange={(e) => handleSaveBranding("accent_color", e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={branding?.accent_color || "#f59e0b"}
                          onChange={(e) => handleSaveBranding("accent_color", e.target.value)}
                          className="flex-1 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="mb-3 block">Trust Badges</Label>
                  <div className="space-y-4">
                    {[1, 2, 3].map((num) => (
                      <div key={num} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                        <div className="space-y-2">
                          <Label>Badge {num} Title</Label>
                          <Input
                            defaultValue={
                              (branding?.[`trust_badge_${num}_title` as keyof BrandingSettings] as string) || ""
                            }
                            onBlur={(e) =>
                              handleSaveBranding(`trust_badge_${num}_title` as keyof BrandingSettings, e.target.value)
                            }
                            placeholder={`Trust badge ${num} title`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Badge {num} Description</Label>
                          <Input
                            defaultValue={
                              (branding?.[`trust_badge_${num}_description` as keyof BrandingSettings] as string) || ""
                            }
                            onBlur={(e) =>
                              handleSaveBranding(
                                `trust_badge_${num}_description` as keyof BrandingSettings,
                                e.target.value,
                              )
                            }
                            placeholder={`Trust badge ${num} description`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="customCss">Custom CSS (Advanced)</Label>
                  <Textarea
                    id="customCss"
                    defaultValue={branding?.customCss || ""}
                    onBlur={(e) => handleSaveBranding("customCss", e.target.value)}
                    placeholder="/* Add custom styles here */"
                    rows={5}
                    className="font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="w-5 h-5" />
                      Feedback Categories
                    </CardTitle>
                    <CardDescription>Configure categories for organizing feedback</CardDescription>
                  </div>
                  <Dialog
                    open={categoryDialog.open}
                    onOpenChange={(open) => {
                      setCategoryDialog({ open })
                      if (!open)
                        setCategoryForm({ name: "", label: "", description: "", color: "#6b7280", icon: "folder" })
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Category
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{categoryDialog.editing ? "Edit Category" : "Add Category"}</DialogTitle>
                        <DialogDescription>Configure category details</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Label</Label>
                          <Input
                            value={categoryForm.label}
                            onChange={(e) => setCategoryForm((p) => ({ ...p, label: e.target.value }))}
                            placeholder="Workplace Environment"
                          />
                        </div>
                        {!categoryDialog.editing && (
                          <div className="space-y-2">
                            <Label>Slug (auto-generated from label)</Label>
                            <Input
                              value={categoryForm.name || (categoryForm.label || "").toLowerCase().replace(/\s+/g, "-")}
                              onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))}
                              placeholder="workplace-environment"
                            />
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={categoryForm.description}
                            onChange={(e) => setCategoryForm((p) => ({ ...p, description: e.target.value }))}
                            placeholder="Description of this category..."
                            rows={2}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Color</Label>
                            <div className="flex flex-wrap gap-2">
                              {COLOR_OPTIONS.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => setCategoryForm((p) => ({ ...p, color }))}
                                  className={`w-8 h-8 rounded-full border-2 transition-transform ${categoryForm.color === color ? "border-slate-900 scale-110" : "border-transparent"}`}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Icon</Label>
                            <Select
                              value={categoryForm.icon}
                              onValueChange={(v) => setCategoryForm((p) => ({ ...p, icon: v }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ICON_OPTIONS.map((icon) => (
                                  <SelectItem key={icon} value={icon}>
                                    {icon}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setCategoryDialog({ open: false })}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveCategory} disabled={isSaving}>
                          {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Save
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categoriesList.map((category) => (
                    <div
                      key={category.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${category.is_active ? "bg-white" : "bg-slate-50 opacity-60"}`}
                    >
                      <div className="flex items-center gap-4">
                        <GripVertical className="w-4 h-4 text-slate-400 cursor-move" />
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color || "#6b7280" }}
                        />
                        <div>
                          <p className="font-medium text-slate-900">{category.label}</p>
                          <p className="text-sm text-slate-500">{category.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={category.is_active ?? true}
                          onCheckedChange={() => handleToggleCategory(category)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setCategoryForm({
                              name: category.name,
                              label: category.label,
                              description: category.description || "",
                              color: category.color || "#6b7280",
                              icon: category.icon || "folder",
                            })
                            setCategoryDialog({ open: true, editing: category })
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {categoriesList.length === 0 && (
                    <p className="text-center text-slate-500 py-8">No categories configured. Add one to get started.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tags Tab */}
          <TabsContent value="tags" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Tags className="w-5 h-5" />
                      Feedback Tags
                    </CardTitle>
                    <CardDescription>Configure tags for labeling feedback items</CardDescription>
                  </div>
                  <Dialog
                    open={tagDialog.open}
                    onOpenChange={(open) => {
                      setTagDialog({ open })
                      if (!open) setTagForm({ name: "", color: "#3b82f6" })
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Tag
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{tagDialog.editing ? "Edit Tag" : "Add Tag"}</DialogTitle>
                        <DialogDescription>Configure tag details</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Tag Name</Label>
                          <Input
                            value={tagForm.name}
                            onChange={(e) => setTagForm((p) => ({ ...p, name: e.target.value }))}
                            placeholder="Communication"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Color</Label>
                          <div className="flex flex-wrap gap-2">
                            {COLOR_OPTIONS.map((color) => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => setTagForm((p) => ({ ...p, color }))}
                                className={`w-8 h-8 rounded-full border-2 transition-transform ${tagForm.color === color ? "border-slate-900 scale-110" : "border-transparent"}`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setTagDialog({ open: false })}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveTag} disabled={isSaving}>
                          {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Save
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {tagsList.map((tag) => (
                    <div
                      key={tag.id}
                      className={`group flex items-center gap-2 px-3 py-2 rounded-full border ${tag.is_active ? "bg-white" : "bg-slate-50 opacity-60"}`}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color || "#3b82f6" }} />
                      <span className="text-sm font-medium">{tag.name}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Switch
                          checked={tag.is_active ?? true}
                          onCheckedChange={() => handleToggleTag(tag)}
                          className="scale-75"
                        />
                        <button
                          onClick={() => {
                            setTagForm({ name: tag.name, color: tag.color || "#3b82f6" })
                            setTagDialog({ open: true, editing: tag })
                          }}
                          className="p-1 hover:bg-slate-100 rounded"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteTag(tag.id)}
                          className="p-1 hover:bg-red-50 text-red-600 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {tagsList.length === 0 && (
                    <p className="text-center text-slate-500 py-8 w-full">
                      No tags configured. Add one to get started.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <HelpCircle className="w-5 h-5" />
                      Form Questions
                    </CardTitle>
                    <CardDescription>Configure questions shown in the feedback form</CardDescription>
                  </div>
                  <Dialog
                    open={questionDialog.open}
                    onOpenChange={(open) => {
                      setQuestionDialog({ open })
                      if (!open)
                        setQuestionForm({
                          questionType: "rating",
                          questionText: "",
                          description: "",
                          isRequired: false,
                          minValue: 1,
                          maxValue: 5,
                          options: [],
                        })
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Question
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>{questionDialog.editing ? "Edit Question" : "Add Question"}</DialogTitle>
                        <DialogDescription>Configure question details</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Question Type</Label>
                          <Select
                            value={questionForm.questionType}
                            onValueChange={(v) => setQuestionForm((p) => ({ ...p, questionType: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="rating">Rating (1-5 scale)</SelectItem>
                              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                              <SelectItem value="text">Short Text</SelectItem>
                              <SelectItem value="textarea">Long Text</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Question Text</Label>
                          <Input
                            value={questionForm.questionText}
                            onChange={(e) => setQuestionForm((p) => ({ ...p, questionText: e.target.value }))}
                            placeholder="How would you rate...?"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description (optional)</Label>
                          <Input
                            value={questionForm.description}
                            onChange={(e) => setQuestionForm((p) => ({ ...p, description: e.target.value }))}
                            placeholder="Additional context for this question"
                          />
                        </div>

                        {questionForm.questionType === "rating" && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Min Value</Label>
                              <Input
                                type="number"
                                value={questionForm.minValue}
                                onChange={(e) =>
                                  setQuestionForm((p) => ({ ...p, minValue: Number.parseInt(e.target.value) }))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Max Value</Label>
                              <Input
                                type="number"
                                value={questionForm.maxValue}
                                onChange={(e) =>
                                  setQuestionForm((p) => ({ ...p, maxValue: Number.parseInt(e.target.value) }))
                                }
                              />
                            </div>
                          </div>
                        )}

                        {questionForm.questionType === "multiple_choice" && (
                          <div className="space-y-2">
                            <Label>Options (one per line)</Label>
                            <Textarea
                              value={questionForm.options.map((o) => o.label).join("\n")}
                              onChange={(e) => {
                                const options = e.target.value
                                  .split("\n")
                                  .filter(Boolean)
                                  .map((label) => ({
                                    value: (label || "").toLowerCase().replace(/\s+/g, "-"),
                                    label,
                                  }))
                                setQuestionForm((p) => ({ ...p, options }))
                              }}
                              placeholder="Option 1&#10;Option 2&#10;Option 3"
                              rows={4}
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={questionForm.isRequired}
                            onCheckedChange={(checked) => setQuestionForm((p) => ({ ...p, isRequired: checked }))}
                          />
                          <Label>Required question</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setQuestionDialog({ open: false })}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveQuestion} disabled={isSaving}>
                          {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Save
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {questionsList.map((question) => (
                    <div
                      key={question.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${question.is_active ? "bg-white" : "bg-slate-50 opacity-60"}`}
                    >
                      <div className="flex items-center gap-4">
                        <GripVertical className="w-4 h-4 text-slate-400 cursor-move" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900">{question.question_text}</p>
                            {question.is_required && (
                              <Badge variant="secondary" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs capitalize">
                              {(question.question_type || "").replace("_", " ")}
                            </Badge>
                            {question.description && (
                              <span className="text-sm text-slate-500">{question.description}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={question.is_active ?? true}
                          onCheckedChange={() => handleToggleQuestion(question)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setQuestionForm({
                              questionType: question.question_type,
                              questionText: question.question_text,
                              description: question.description || "",
                              isRequired: question.is_required ?? false,
                              minValue: question.min_value ?? 1,
                              maxValue: question.max_value ?? 5,
                              options: (question.options as { value: string; label: string }[]) || [],
                            })
                            setQuestionDialog({ open: true, editing: question })
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {questionsList.length === 0 && (
                    <p className="text-center text-slate-500 py-8">No questions configured. Add one to get started.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            {/* Telegram Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                  </svg>
                  Telegram Notifications
                </CardTitle>
                <CardDescription>Receive instant notifications via Telegram bot</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">Enable Telegram Notifications</p>
                    <p className="text-sm text-slate-500">Send notifications to your Telegram chat</p>
                  </div>
                  <Switch
                    checked={telegramSetting?.is_enabled ?? false}
                    onCheckedChange={(checked) => handleToggleNotification("telegram", checked)}
                  />
                </div>

                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="botToken">Bot Token</Label>
                    <Input
                      id="botToken"
                      type="password"
                      value={telegramConfig.botToken}
                      onChange={(e) => setTelegramConfig((p) => ({ ...p, botToken: e.target.value }))}
                      placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                    />
                    <p className="text-xs text-slate-500">Create a bot via @BotFather on Telegram to get your token</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chatId">Chat ID</Label>
                    <Input
                      id="chatId"
                      value={telegramConfig.chatId}
                      onChange={(e) => setTelegramConfig((p) => ({ ...p, chatId: e.target.value }))}
                      placeholder="-1001234567890"
                    />
                    <div className="text-xs text-slate-500 space-y-1">
                      <p>
                        <strong>To get your Chat ID:</strong>
                      </p>
                      <ol className="list-decimal list-inside space-y-0.5 ml-1">
                        <li>Start a chat with your bot first (send any message)</li>
                        <li>
                          Then message <code className="bg-slate-100 px-1 rounded">@userinfobot</code> to get your ID
                        </li>
                        <li>For groups, add the bot to the group and use the group ID (starts with -)</li>
                      </ol>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleSaveTelegram} disabled={isSaving}>
                      {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Save Configuration
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleTestTelegram}
                      disabled={telegramTesting || !telegramConfig.botToken || !telegramConfig.chatId}
                    >
                      {telegramTesting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Test Connection
                    </Button>
                  </div>

                  {telegramTestResult && (
                    <div
                      className={`p-3 rounded-lg ${telegramTestResult.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                    >
                      <div className="flex items-center gap-2">
                        {telegramTestResult.success ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Bell className="w-4 h-4" />
                        )}
                        <span className="text-sm">{telegramTestResult.message}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Other Notification Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Mail className="w-5 h-5" />
                    Email Notifications
                  </CardTitle>
                  <CardDescription>Receive email alerts for feedback</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable Email</Label>
                    <Switch
                      checked={emailSetting?.is_enabled ?? false}
                      onCheckedChange={(checked) => handleToggleNotification("email", checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Notification Email</Label>
                    <Input id="email" type="email" placeholder="admin@company.com" />
                  </div>
                  <Button className="w-full">Save Email Settings</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Webhook className="w-5 h-5" />
                    Slack Integration
                  </CardTitle>
                  <CardDescription>Send notifications to Slack</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable Slack</Label>
                    <Switch
                      checked={slackSetting?.is_enabled ?? false}
                      onCheckedChange={(checked) => handleToggleNotification("slack", checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slack-url">Webhook URL</Label>
                    <Input id="slack-url" placeholder="https://hooks.slack.com/services/..." />
                  </div>
                  <Button className="w-full">Save Slack Settings</Button>
                </CardContent>
              </Card>
            </div>

            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Events</CardTitle>
                <CardDescription>Choose which events trigger notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>New Feedback Submitted</Label>
                    <p className="text-sm text-slate-500">Get notified when new feedback is submitted</p>
                  </div>
                  <Switch
                    checked={
                      notifications.find((n) => n.notification_type === "email")?.notify_on_new_feedback ?? false
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Urgent/Critical Feedback</Label>
                    <p className="text-sm text-slate-500">Immediate notification for high-priority items</p>
                  </div>
                  <Switch
                    checked={notifications.find((n) => n.notification_type === "email")?.notify_on_urgent ?? false}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Clarification Responses</Label>
                    <p className="text-sm text-slate-500">When submitters respond to follow-up questions</p>
                  </div>
                  <Switch
                    checked={
                      notifications.find((n) => n.notification_type === "email")?.notify_on_clarification_response ??
                      false
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Daily Digest</Label>
                    <p className="text-sm text-slate-500">Summary of feedback activity sent daily</p>
                  </div>
                  <Switch
                    checked={notifications.find((n) => n.notification_type === "email")?.notify_daily_digest ?? false}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Tab */}
          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  API Authentication
                </CardTitle>
                <CardDescription>Use your API key to authenticate requests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <code className="flex-1 bg-slate-100 px-4 py-3 rounded-lg font-mono text-sm">
                    FEEDBACK_API_KEY=your-secret-key-here
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard("FEEDBACK_API_KEY=your-secret-key-here", "apikey")}
                  >
                    {copied === "apikey" ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-sm text-slate-500">Set this environment variable in your Vercel project settings.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Endpoints</CardTitle>
                <CardDescription>Available REST API endpoints</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                    <Badge className="bg-emerald-100 text-emerald-700">GET</Badge>
                    <code className="font-mono text-sm">/api/feedback</code>
                    <span className="text-sm text-slate-500 ml-auto">List all feedback</span>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                    <Badge className="bg-blue-100 text-blue-700">POST</Badge>
                    <code className="font-mono text-sm">/api/feedback</code>
                    <span className="text-sm text-slate-500 ml-auto">Submit new feedback</span>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                    <Badge className="bg-emerald-100 text-emerald-700">GET</Badge>
                    <code className="font-mono text-sm">/api/feedback/[id]</code>
                    <span className="text-sm text-slate-500 ml-auto">Get single feedback</span>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                    <Badge className="bg-amber-100 text-amber-700">PATCH</Badge>
                    <code className="font-mono text-sm">/api/feedback/[id]</code>
                    <span className="text-sm text-slate-500 ml-auto">Update feedback</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
