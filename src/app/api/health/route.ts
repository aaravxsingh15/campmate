import { NextResponse } from "next/server";
import { isAIConfigured, isLiveMode, isSupabaseConfigured } from "@/lib/env";

export function GET() {
  return NextResponse.json({
    status: "ok",
    supabase: isSupabaseConfigured,
    database: isLiveMode,
    ai: isAIConfigured,
    mode: isLiveMode ? "live" : "demo",
  });
}
