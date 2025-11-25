import { getBrandingSettings } from "@/app/actions/config"
import { FeedbackForm } from "@/components/feedback/feedback-form"
import { SiteHeader } from "@/components/layout/site-header"
import { Shield, Lock, Eye, MessageSquare } from "lucide-react"

export default async function HomePage() {
  const branding = await getBrandingSettings()

  const primaryColor = branding?.primaryColor || "#10b981"

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <SiteHeader />
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          {branding?.logoUrl ? (
            <img
              src={branding.logoUrl || "/placeholder.svg"}
              alt={branding.siteName || "Logo"}
              className="w-16 h-16 mx-auto mb-6 object-contain"
            />
          ) : (
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <Shield className="w-8 h-8" style={{ color: primaryColor }} />
            </div>
          )}
          <h1 className="text-4xl font-bold text-slate-900 mb-4 text-balance">
            {branding?.siteName || "Anonymous Feedback Portal"}
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto text-pretty">
            {branding?.siteDescription ||
              "Share your thoughts openly and honestly. Your identity is protected through advanced encryption and privacy measures."}
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-200">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}20` }}>
              <Lock className="w-5 h-5" style={{ color: primaryColor }} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{branding?.trustBadge1Title || "End-to-End Encryption"}</h3>
              <p className="text-sm text-slate-600">
                {branding?.trustBadge1Description || "Your feedback is encrypted before transmission"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-200">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}20` }}>
              <Eye className="w-5 h-5" style={{ color: primaryColor }} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{branding?.trustBadge2Title || "No IP Tracking"}</h3>
              <p className="text-sm text-slate-600">
                {branding?.trustBadge2Description || "We strip all identifying metadata"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-200">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}20` }}>
              <MessageSquare className="w-5 h-5" style={{ color: primaryColor }} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{branding?.trustBadge3Title || "Anonymous Follow-ups"}</h3>
              <p className="text-sm text-slate-600">
                {branding?.trustBadge3Description || "Communicate without revealing identity"}
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Form */}
        <FeedbackForm />
      </div>

      {/* Custom CSS injection */}
      {branding?.customCss && <style dangerouslySetInnerHTML={{ __html: branding.customCss }} />}
    </main>
  )
}
