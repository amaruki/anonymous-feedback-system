"use client"

import { useState, useEffect, useCallback, memo, useRef } from "react"
import useSWR, { mutate } from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Trash2,
  Edit,
  Palette,
  Bell,
  HelpCircle,
  FolderOpen,
  TagIcon,
  Copy,
  Check,
  GripVertical,
  Send,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react"
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getTags as getTagsAction,
  createTag,
  updateTag,
  deleteTag,
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getBrandingSettings,
  updateBrandingSettings,
  getNotificationSettings,
  updateNotificationSettings,
  testTelegramNotification,
} from "@/app/actions/config"
import type { Category, Question, BrandingSettings, NotificationSetting } from "@/lib/db"

// SWR keys
const SWR_KEYS = {
  categories: "admin-categories",
  tags: "admin-tags",
  questions: "admin-questions",
  branding: "admin-branding",
  notifications: "admin-notifications",
}

// Memoized Category Item Component
const CategoryItem = memo(function CategoryItem({
  category,
  onEdit,
  onToggle,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  isDragged,
}: {
  category: Category
  onEdit: (category: Category) => void
  onToggle: (category: Category) => void
  onDelete: (id: string) => void
  onDragStart: (e: React.DragEvent, category: Category) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, category: Category) => void
  isDragged: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between p-4 border rounded-lg bg-card transition-opacity ${
        isDragged ? "opacity-50" : ""
      }`}
      draggable
      onDragStart={(e) => onDragStart(e, category)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, category)}
    >
      <div className="flex items-center gap-3">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
        <div>
          <p className="font-medium">{category.label}</p>
          <p className="text-sm text-muted-foreground">{category.name}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={category.isActive} onCheckedChange={() => onToggle(category)} />
        <Button variant="ghost" size="icon" onClick={() => onEdit(category)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(category.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
})

// Memoized Tag Item Component
const TagItem = memo(function TagItem({
  tag,
  onToggle,
  onDelete,
}: {
  tag: any
  onToggle: (tag: any) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
      <div className="flex items-center gap-2">
        <Badge style={{ backgroundColor: tag.color }}>{tag.name}</Badge>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={tag.isActive} onCheckedChange={() => onToggle(tag)} />
        <Button variant="ghost" size="icon" onClick={() => onDelete(tag.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
})

// Memoized Question Item Component
const QuestionItem = memo(function QuestionItem({
  question,
  onEdit,
  onToggle,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  isDragged,
}: {
  question: Question
  onEdit: (question: Question) => void
  onToggle: (question: Question) => void
  onDelete: (id: string) => void
  onDragStart: (e: React.DragEvent, question: Question) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, question: Question) => void
  isDragged: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between p-4 border rounded-lg bg-card transition-opacity ${
        isDragged ? "opacity-50" : ""
      }`}
      draggable
      onDragStart={(e) => onDragStart(e, question)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, question)}
    >
      <div className="flex items-center gap-3">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
        <div>
          <p className="font-medium">{question.questionText}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{question.questionType}</Badge>
            {question.isRequired && <Badge variant="secondary">Required</Badge>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={question.isActive} onCheckedChange={() => onToggle(question)} />
        <Button variant="ghost" size="icon" onClick={() => onEdit(question)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(question.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
})

export function AdminSettings() {
  const [copied, setCopied] = useState<string | null>(null)

  const { data: categoriesList = [], isLoading: loadingCategories } = useSWR(SWR_KEYS.categories, getCategories)
  const { data: tagsList = [], isLoading: loadingTags } = useSWR(SWR_KEYS.tags, getTagsAction)
  const { data: questionsList = [], isLoading: loadingQuestions } = useSWR(SWR_KEYS.questions, getQuestions)
  const { data: branding, isLoading: loadingBranding } = useSWR(SWR_KEYS.branding, getBrandingSettings)
  const { data: notifications = [], isLoading: loadingNotifications } = useSWR(
    SWR_KEYS.notifications,
    getNotificationSettings,
  )

  const isLoading = loadingCategories || loadingTags || loadingQuestions || loadingBranding || loadingNotifications

  // Dialog state
  const [categoryDialog, setCategoryDialog] = useState<{ open: boolean; editing?: Category }>({ open: false })
  const [tagDialog, setTagDialog] = useState<{ open: boolean; editing?: any }>({ open: false })
  const [questionDialog, setQuestionDialog] = useState<{ open: boolean; editing?: Question }>({ open: false })
  const [isSaving, setIsSaving] = useState(false)

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

  // Drag and drop state
  const [draggedCategory, setDraggedCategory] = useState<Category | null>(null)
  const [draggedQuestion, setDraggedQuestion] = useState<Question | null>(null)
  const [brandingForm, setBrandingForm] = useState({
    siteName: "",
    logoUrl: "",
    siteDescription: "",
    primaryColor: "#3b82f6",
    secondaryColor: "#64748b",
    accentColor: "#10b981",
    trustBadge1Title: "",
    trustBadge1Description: "",
    trustBadge2Title: "",
    trustBadge2Description: "",
    trustBadge3Title: "",
    trustBadge3Description: "",
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>("")

  useEffect(() => {
    const telegramSetting = notifications.find((n) => n.notificationType === "telegram")
    if (telegramSetting?.config) {
      const config = telegramSetting.config as {
        botToken?: string
        chatId?: string
        bot_token?: string
        chat_id?: string
      }
      setTelegramConfig({
        botToken: config.botToken || config.bot_token || "",
        chatId: config.chatId || config.chat_id || "",
      })
    }
  }, [notifications])

  useEffect(() => {
    if (branding) {
      setBrandingForm({
        siteName: branding.siteName || "",
        logoUrl: branding.logoUrl || "",
        siteDescription: branding.siteDescription || "",
        primaryColor: branding.primaryColor || "#3b82f6",
        secondaryColor: branding.secondaryColor || "#64748b",
        accentColor: branding.accentColor || "#10b981",
        trustBadge1Title: branding.trustBadge1Title || "",
        trustBadge1Description: branding.trustBadge1Description || "",
        trustBadge2Title: branding.trustBadge2Title || "",
        trustBadge2Description: branding.trustBadge2Description || "",
        trustBadge3Title: branding.trustBadge3Title || "",
        trustBadge3Description: branding.trustBadge3Description || "",
      })
      setLogoPreview(branding.logoUrl || "")
    }
  }, [branding])

  const copyToClipboard = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }, [])

  const handleSaveCategory = useCallback(async () => {
    setIsSaving(true)
    try {
      if (categoryDialog.editing) {
        // Optimistic update
        mutate(
          SWR_KEYS.categories,
          (current: Category[] | undefined) =>
            current?.map((c) =>
              c.id === categoryDialog.editing!.id
                ? {
                    ...c,
                    label: categoryForm.label,
                    description: categoryForm.description,
                    color: categoryForm.color,
                    icon: categoryForm.icon,
                  }
                : c,
            ),
          false,
        )

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
      mutate(SWR_KEYS.categories)
    } catch (error) {
      console.error("[v0] Error saving category:", error)
      mutate(SWR_KEYS.categories) // Revalidate on error
    } finally {
      setIsSaving(false)
    }
  }, [categoryDialog.editing, categoryForm])

  const handleDeleteCategory = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return
    try {
      // Optimistic update
      mutate(SWR_KEYS.categories, (current: Category[] | undefined) => current?.filter((c) => c.id !== id), false)
      await deleteCategory(id)
      mutate(SWR_KEYS.categories)
    } catch (error) {
      console.error("[v0] Error deleting category:", error)
      mutate(SWR_KEYS.categories)
    }
  }, [])

  const handleToggleCategory = useCallback(async (category: Category) => {
    try {
      // Optimistic update
      mutate(
        SWR_KEYS.categories,
        (current: Category[] | undefined) =>
          current?.map((c) => (c.id === category.id ? { ...c, isActive: !c.isActive } : c)),
        false,
      )
      await updateCategory(category.id, { isActive: !category.isActive })
      mutate(SWR_KEYS.categories)
    } catch (error) {
      console.error("[v0] Error toggling category:", error)
      mutate(SWR_KEYS.categories)
    }
  }, [])

  const handleEditCategory = useCallback((category: Category) => {
    setCategoryForm({
      name: category.name,
      label: category.label,
      description: category.description || "",
      color: category.color,
      icon: category.icon,
    })
    setCategoryDialog({ open: true, editing: category })
  }, [])

  const handleSaveTag = useCallback(async () => {
    setIsSaving(true)
    try {
      if (tagDialog.editing) {
        mutate(
          SWR_KEYS.tags,
          (current: any[] | undefined) =>
            current?.map((t) =>
              t.id === tagDialog.editing!.id ? { ...t, name: tagForm.name, color: tagForm.color } : t,
            ),
          false,
        )
        await updateTag(tagDialog.editing.id, { name: tagForm.name, color: tagForm.color })
      } else {
        await createTag(tagForm)
      }
      setTagDialog({ open: false })
      setTagForm({ name: "", color: "#3b82f6" })
      mutate(SWR_KEYS.tags)
    } catch (error) {
      console.error("[v0] Error saving tag:", error)
      mutate(SWR_KEYS.tags)
    } finally {
      setIsSaving(false)
    }
  }, [tagDialog.editing, tagForm])

  const handleDeleteTag = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this tag?")) return
    try {
      mutate(SWR_KEYS.tags, (current: any[] | undefined) => current?.filter((t) => t.id !== id), false)
      await deleteTag(id)
      mutate(SWR_KEYS.tags)
    } catch (error) {
      console.error("[v0] Error deleting tag:", error)
      mutate(SWR_KEYS.tags)
    }
  }, [])

  const handleToggleTag = useCallback(async (tag: any) => {
    try {
      mutate(
        SWR_KEYS.tags,
        (current: any[] | undefined) => current?.map((t) => (t.id === tag.id ? { ...t, isActive: !t.isActive } : t)),
        false,
      )
      await updateTag(tag.id, { isActive: !tag.isActive })
      mutate(SWR_KEYS.tags)
    } catch (error) {
      console.error("[v0] Error toggling tag:", error)
      mutate(SWR_KEYS.tags)
    }
  }, [])

  const handleSaveQuestion = useCallback(async () => {
    setIsSaving(true)
    try {
      const data = {
        questionType: questionForm.questionType as Question["questionType"],
        questionText: questionForm.questionText,
        isRequired: questionForm.isRequired,
        minValue: questionForm.questionType === "rating" ? questionForm.minValue : undefined,
        maxValue: questionForm.questionType === "rating" ? questionForm.maxValue : undefined,
        options:
          questionForm.questionType === "select" || questionForm.questionType === "multiselect"
            ? JSON.stringify(questionForm.options)
            : undefined,
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
      mutate(SWR_KEYS.questions)
    } catch (error) {
      console.error("[v0] Error saving question:", error)
      mutate(SWR_KEYS.questions)
    } finally {
      setIsSaving(false)
    }
  }, [questionDialog.editing, questionForm])

  const handleDeleteQuestion = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return
    try {
      mutate(SWR_KEYS.questions, (current: Question[] | undefined) => current?.filter((q) => q.id !== id), false)
      await deleteQuestion(id)
      mutate(SWR_KEYS.questions)
    } catch (error) {
      console.error("[v0] Error deleting question:", error)
      mutate(SWR_KEYS.questions)
    }
  }, [])

  const handleToggleQuestion = useCallback(async (question: Question) => {
    try {
      mutate(
        SWR_KEYS.questions,
        (current: Question[] | undefined) =>
          current?.map((q) => (q.id === question.id ? { ...q, isActive: !q.isActive } : q)),
        false,
      )
      await updateQuestion(question.id, { isActive: !question.isActive })
      mutate(SWR_KEYS.questions)
    } catch (error) {
      console.error("[v0] Error toggling question:", error)
      mutate(SWR_KEYS.questions)
    }
  }, [])

  const handleEditQuestion = useCallback((question: Question) => {
    let parsedOptions: { value: string; label: string }[] = []
    if (question.options) {
      try {
        parsedOptions = JSON.parse(question.options)
      } catch {
        parsedOptions = []
      }
    }
    setQuestionForm({
      questionType: question.questionType,
      questionText: question.questionText,
      description: "",
      isRequired: question.isRequired,
      minValue: question.minValue || 1,
      maxValue: question.maxValue || 5,
      options: parsedOptions,
    })
    setQuestionDialog({ open: true, editing: question })
  }, [])

  const handleSaveBranding = useCallback(async (field: keyof BrandingSettings, value: string) => {
    try {
      mutate(
        SWR_KEYS.branding,
        (current: BrandingSettings | null | undefined) => (current ? { ...current, [field]: value } : current),
        false,
      )
      await updateBrandingSettings({ [field]: value })
      mutate(SWR_KEYS.branding)
    } catch (error) {
      console.error("[v0] Error saving branding:", error)
      mutate(SWR_KEYS.branding)
    }
  }, [])

  // Telegram handlers
  const handleSaveTelegram = useCallback(async () => {
    setIsSaving(true)
    try {
      await updateNotificationSettings("telegram", {
        config: { botToken: telegramConfig.botToken, chatId: telegramConfig.chatId },
        isEnabled: true,
      })
      mutate(SWR_KEYS.notifications)
    } catch (error) {
      console.error("[v0] Error saving telegram settings:", error)
    } finally {
      setIsSaving(false)
    }
  }, [telegramConfig])

  const handleTestTelegram = useCallback(async () => {
    setTelegramTesting(true)
    setTelegramTestResult(null)
    try {
      const result = await testTelegramNotification(telegramConfig.botToken, telegramConfig.chatId)
      setTelegramTestResult(result)
    } catch (error) {
      setTelegramTestResult({ success: false, message: "Failed to test notification" })
    } finally {
      setTelegramTesting(false)
    }
  }, [telegramConfig])

  const handleToggleNotification = useCallback(async (notification: NotificationSetting) => {
    try {
      mutate(
        SWR_KEYS.notifications,
        (current: NotificationSetting[] | undefined) =>
          current?.map((n) => (n.id === notification.id ? { ...n, isEnabled: !n.isEnabled } : n)),
        false,
      )
      await updateNotificationSettings(notification.notificationType, { isEnabled: !notification.isEnabled })
      mutate(SWR_KEYS.notifications)
    } catch (error) {
      console.error("[v0] Error toggling notification:", error)
      mutate(SWR_KEYS.notifications)
    }
  }, [])

  // Drag and drop handlers for categories
  const handleCategoryDragStart = useCallback((e: React.DragEvent, category: Category) => {
    setDraggedCategory(category)
    e.dataTransfer.effectAllowed = "move"
  }, [])

  const handleCategoryDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }, [])

  const handleCategoryDrop = useCallback(
    async (e: React.DragEvent, targetCategory: Category) => {
      e.preventDefault()
      if (!draggedCategory || draggedCategory.id === targetCategory.id) return

      try {
        // Create new order array
        const newOrder = [...categoriesList]
        const draggedIndex = newOrder.findIndex((c) => c.id === draggedCategory.id)
        const targetIndex = newOrder.findIndex((c) => c.id === targetCategory.id)

        // Remove dragged item and insert at target position
        newOrder.splice(draggedIndex, 1)
        newOrder.splice(targetIndex, 0, draggedCategory)

        // Update sort order for all items
        const updates = newOrder.map((category, index) => ({
          id: category.id,
          sortOrder: index,
        }))

        // Optimistic update
        mutate(SWR_KEYS.categories, newOrder, false)

        // Update all categories with new sort order
        await Promise.all(updates.map((update) => updateCategory(update.id, { sortOrder: update.sortOrder })))
        mutate(SWR_KEYS.categories)
      } catch (error) {
        console.error("[v0] Error reordering categories:", error)
        mutate(SWR_KEYS.categories) // Revalidate on error
      } finally {
        setDraggedCategory(null)
      }
    },
    [draggedCategory, categoriesList],
  )

  // Drag and drop handlers for questions
  const handleQuestionDragStart = useCallback((e: React.DragEvent, question: Question) => {
    setDraggedQuestion(question)
    e.dataTransfer.effectAllowed = "move"
  }, [])

  const handleQuestionDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }, [])

  const handleQuestionDrop = useCallback(
    async (e: React.DragEvent, targetQuestion: Question) => {
      e.preventDefault()
      if (!draggedQuestion || draggedQuestion.id === targetQuestion.id) return

      try {
        // Create new order array
        const newOrder = [...questionsList]
        const draggedIndex = newOrder.findIndex((q) => q.id === draggedQuestion.id)
        const targetIndex = newOrder.findIndex((q) => q.id === targetQuestion.id)

        // Remove dragged item and insert at target position
        newOrder.splice(draggedIndex, 1)
        newOrder.splice(targetIndex, 0, draggedQuestion)

        // Update sort order for all items
        const updates = newOrder.map((question, index) => ({
          id: question.id,
          sortOrder: index,
        }))

        // Optimistic update
        mutate(SWR_KEYS.questions, newOrder, false)

        // Update all questions with new sort order
        await Promise.all(updates.map((update) => updateQuestion(update.id, { sortOrder: update.sortOrder })))
        mutate(SWR_KEYS.questions)
      } catch (error) {
        console.error("[v0] Error reordering questions:", error)
        mutate(SWR_KEYS.questions) // Revalidate on error
      } finally {
        setDraggedQuestion(null)
      }
    },
    [draggedQuestion, questionsList],
  )

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setLogoPreview(base64String)
        setBrandingForm(prev => ({ ...prev, logoUrl: base64String }))
        handleSaveBranding("logoUrl", base64String)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  // Update the color change handler
  const handleColorChange = useCallback((field: keyof BrandingSettings, value: string) => {
    setBrandingForm(prev => ({ ...prev, [field]: value }))
    handleSaveBranding(field, value)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <TagIcon className="h-4 w-4" />
            Tags
          </TabsTrigger>
          <TabsTrigger value="questions" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Questions
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Feedback Categories</CardTitle>
                <CardDescription>Manage categories for organizing feedback</CardDescription>
              </div>
              <Button onClick={() => setCategoryDialog({ open: true })}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {categoriesList.map((category) => (
                <CategoryItem
                  key={category.id}
                  category={category}
                  onEdit={handleEditCategory}
                  onToggle={handleToggleCategory}
                  onDelete={handleDeleteCategory}
                  onDragStart={handleCategoryDragStart}
                  onDragOver={handleCategoryDragOver}
                  onDrop={handleCategoryDrop}
                  isDragged={draggedCategory?.id === category.id}
                />
              ))}
              {categoriesList.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No categories yet. Add your first category.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tags Tab */}
        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Feedback Tags</CardTitle>
                <CardDescription>Manage tags for labeling feedback</CardDescription>
              </div>
              <Button onClick={() => setTagDialog({ open: true })}>
                <Plus className="h-4 w-4 mr-2" />
                Add Tag
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {tagsList.map((tag) => (
                  <TagItem key={tag.id} tag={tag} onToggle={handleToggleTag} onDelete={handleDeleteTag} />
                ))}
              </div>
              {tagsList.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No tags yet. Add your first tag.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Custom Questions</CardTitle>
                <CardDescription>Add custom questions to the feedback form</CardDescription>
              </div>
              <Button onClick={() => setQuestionDialog({ open: true })}>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {questionsList.map((question) => (
                <QuestionItem
                  key={question.id}
                  question={question}
                  onEdit={handleEditQuestion}
                  onToggle={handleToggleQuestion}
                  onDelete={handleDeleteQuestion}
                  onDragStart={handleQuestionDragStart}
                  onDragOver={handleQuestionDragOver}
                  onDrop={handleQuestionDrop}
                  isDragged={draggedQuestion?.id === question.id}
                />
              ))}
              {questionsList.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No custom questions yet. Add your first question.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Site Branding</CardTitle>
              <CardDescription>Customize the appearance of your feedback portal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Site Name</Label>
                  <Input
                    value={brandingForm.siteName}
                    onChange={(e) => setBrandingForm(prev => ({ ...prev, siteName: e.target.value }))}
                    onBlur={(e) => handleSaveBranding("siteName", e.target.value)}
                    placeholder="Anonymous Feedback"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="flex-1"
                    />
                    {logoPreview && (
                      <img src={logoPreview} alt="Logo preview" className="h-10 w-10 object-contain border rounded" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Upload an image file</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Site Description</Label>
                <Textarea
                  value={brandingForm.siteDescription}
                  onChange={(e) => setBrandingForm(prev => ({ ...prev, siteDescription: e.target.value }))}
                  onBlur={(e) => handleSaveBranding("siteDescription", e.target.value)}
                  placeholder="Share your thoughts anonymously..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={brandingForm.primaryColor}
                      onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={brandingForm.primaryColor}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                      onBlur={(e) => handleSaveBranding("primaryColor", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={brandingForm.secondaryColor}
                      onChange={(e) => handleColorChange("secondaryColor", e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={brandingForm.secondaryColor}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      onBlur={(e) => handleSaveBranding("secondaryColor", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={brandingForm.accentColor}
                      onChange={(e) => handleColorChange("accentColor", e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={brandingForm.accentColor}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, accentColor: e.target.value }))}
                      onBlur={(e) => handleSaveBranding("accentColor", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Trust Badges</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Badge 1 Title</Label>
                    <Input
                      value={brandingForm.trustBadge1Title}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, trustBadge1Title: e.target.value }))}
                      onBlur={(e) => handleSaveBranding("trustBadge1Title", e.target.value)}
                      placeholder="100% Anonymous"
                    />
                    <Input
                      value={brandingForm.trustBadge1Description}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, trustBadge1Description: e.target.value }))}
                      onBlur={(e) => handleSaveBranding("trustBadge1Description", e.target.value)}
                      placeholder="Your identity is protected"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Badge 2 Title</Label>
                    <Input
                      value={brandingForm.trustBadge2Title}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, trustBadge2Title: e.target.value }))}
                      onBlur={(e) => handleSaveBranding("trustBadge2Title", e.target.value)}
                      placeholder="Secure"
                    />
                    <Input
                      value={brandingForm.trustBadge2Description}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, trustBadge2Description: e.target.value }))}
                      onBlur={(e) => handleSaveBranding("trustBadge2Description", e.target.value)}
                      placeholder="End-to-end encryption"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Badge 3 Title</Label>
                    <Input
                      value={brandingForm.trustBadge3Title}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, trustBadge3Title: e.target.value }))}
                      onBlur={(e) => handleSaveBranding("trustBadge3Title", e.target.value)}
                      placeholder="Confidential"
                    />
                    <Input
                      value={brandingForm.trustBadge3Description}
                      onChange={(e) => setBrandingForm(prev => ({ ...prev, trustBadge3Description: e.target.value }))}
                      onBlur={(e) => handleSaveBranding("trustBadge3Description", e.target.value)}
                      placeholder="Your feedback is private"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Telegram Notifications</CardTitle>
              <CardDescription>Receive notifications via Telegram bot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Bot Token</Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={telegramConfig.botToken}
                    onChange={(e) => setTelegramConfig((prev) => ({ ...prev, botToken: e.target.value }))}
                    placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(telegramConfig.botToken, "botToken")}
                  >
                    {copied === "botToken" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Get from @BotFather on Telegram</p>
              </div>
              <div className="space-y-2">
                <Label>Chat ID</Label>
                <Input
                  value={telegramConfig.chatId}
                  onChange={(e) => setTelegramConfig((prev) => ({ ...prev, chatId: e.target.value }))}
                  placeholder="-1001234567890"
                />
                <p className="text-xs text-muted-foreground">
                  Your personal chat ID or group chat ID. Send /start to the bot first, then get ID from @userinfobot
                </p>
              </div>

              {telegramTestResult && (
                <div
                  className={`p-3 rounded-lg flex items-center gap-2 ${telegramTestResult.success ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"}`}
                >
                  {telegramTestResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  {telegramTestResult.message}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSaveTelegram} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Save Settings
                </Button>
                <Button variant="outline" onClick={handleTestTelegram} disabled={telegramTesting}>
                  {telegramTesting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Test Notification
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Other notification channels */}
          <Card>
            <CardHeader>
              <CardTitle>Other Notification Channels</CardTitle>
              <CardDescription>Manage email, Slack, and webhook notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notifications
                .filter((n) => n.notificationType !== "telegram")
                .map((notification) => (
                  <div key={notification.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{notification.notificationType}</p>
                      <p className="text-sm text-muted-foreground">{notification.isEnabled ? "Enabled" : "Disabled"}</p>
                    </div>
                    <Switch
                      checked={notification.isEnabled}
                      onCheckedChange={() => handleToggleNotification(notification)}
                    />
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={categoryDialog.open} onOpenChange={(open) => !open && setCategoryDialog({ open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{categoryDialog.editing ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>
              {categoryDialog.editing ? "Update category details" : "Create a new category for feedback"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!categoryDialog.editing && (
              <div className="space-y-2">
                <Label>Name (slug)</Label>
                <Input
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="product-feedback"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={categoryForm.label}
                onChange={(e) => {
                  const label = e.target.value
                  setCategoryForm((prev) => ({
                    ...prev,
                    label,
                    name: categoryDialog.editing ? prev.name : (label || "").toLowerCase().replace(/\s+/g, "-"),
                  }))
                }}
                placeholder="Product Feedback"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Feedback about our products..."
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, color: e.target.value }))}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, color: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialog({ open: false })}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategory} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {categoryDialog.editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tag Dialog */}
      <Dialog open={tagDialog.open} onOpenChange={(open) => !open && setTagDialog({ open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tagDialog.editing ? "Edit Tag" : "Add Tag"}</DialogTitle>
            <DialogDescription>{tagDialog.editing ? "Update tag details" : "Create a new tag"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={tagForm.name}
                onChange={(e) => setTagForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="bug"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={tagForm.color}
                  onChange={(e) => setTagForm((prev) => ({ ...prev, color: e.target.value }))}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={tagForm.color}
                  onChange={(e) => setTagForm((prev) => ({ ...prev, color: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagDialog({ open: false })}>
              Cancel
            </Button>
            <Button onClick={handleSaveTag} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {tagDialog.editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={questionDialog.open} onOpenChange={(open) => !open && setQuestionDialog({ open: false })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{questionDialog.editing ? "Edit Question" : "Add Question"}</DialogTitle>
            <DialogDescription>
              {questionDialog.editing ? "Update question details" : "Create a new custom question"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Question Type</Label>
              <Select
                value={questionForm.questionType}
                onValueChange={(value) => setQuestionForm((prev) => ({ ...prev, questionType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="textarea">Long Text</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="select">Select</SelectItem>
                  <SelectItem value="multiselect">Multi-Select</SelectItem>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Question Text</Label>
              <Textarea
                value={questionForm.questionText}
                onChange={(e) => setQuestionForm((prev) => ({ ...prev, questionText: e.target.value }))}
                placeholder="How would you rate our service?"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={questionForm.isRequired}
                onCheckedChange={(checked) => setQuestionForm((prev) => ({ ...prev, isRequired: checked }))}
              />
              <Label>Required</Label>
            </div>
            {questionForm.questionType === "rating" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Value</Label>
                  <Input
                    type="number"
                    value={questionForm.minValue}
                    onChange={(e) =>
                      setQuestionForm((prev) => ({ ...prev, minValue: Number.parseInt(e.target.value) || 1 }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Value</Label>
                  <Input
                    type="number"
                    value={questionForm.maxValue}
                    onChange={(e) =>
                      setQuestionForm((prev) => ({ ...prev, maxValue: Number.parseInt(e.target.value) || 5 }))
                    }
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionDialog({ open: false })}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuestion} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {questionDialog.editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
