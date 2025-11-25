import { Suspense } from "react"
import { AdminSettings } from "@/components/admin/admin-settings"
import { Loader2 } from "lucide-react"

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <AdminSettings />
    </Suspense>
  )
}
