import { Suspense } from "react"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { Loader2 } from "lucide-react"

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <AdminDashboard />
    </Suspense>
  )
}
