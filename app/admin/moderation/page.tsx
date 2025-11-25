import { Suspense } from "react"
import { ModerationQueue } from "@/components/admin/moderation-queue"
import { Loader2 } from "lucide-react"

export default function ModerationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <ModerationQueue />
    </Suspense>
  )
}
