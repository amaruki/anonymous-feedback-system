"use client";

import { useState, useEffect } from "react";
import { getModerationStats } from "@/app/actions/moderation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Settings, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [moderationStats, setModerationStats] = useState<Awaited<
    ReturnType<typeof getModerationStats>
  > | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const modStats = await getModerationStats();
      setModerationStats(modStats);
    } catch (error) {
      console.error("[v0] Error loading admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const needsModeration =
    (moderationStats?.flagged || 0) + (moderationStats?.pending || 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Shield className="w-5 h-5 text-emerald-600" />
              </div>
              <Link href="/admin" className="flex flex-col">
                <h1 className="font-semibold text-slate-900">Feedback Admin</h1>
                <p className="text-xs text-slate-500">
                  Anonymous feedback management
                </p>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {needsModeration > 0 && (
                <Link href="/admin/moderation">
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Moderation Queue
                    <Badge className="bg-amber-100 text-amber-700">
                      {needsModeration}
                    </Badge>
                  </Button>
                </Link>
              )}
              <Link href="/admin/settings">
                <Button variant="ghost" size="icon">
                  <Settings className="w-5 h-5" />
                </Button>
              </Link>
              <Link
                href="/"
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                View Submission Portal
              </Link>
            </div>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
