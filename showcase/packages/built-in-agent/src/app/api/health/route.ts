import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    status: "ok",
    package: "built-in-agent",
    backend: "tanstack-ai",
    openai_api_key: process.env.OPENAI_API_KEY ? "set" : "NOT SET",
  });
}
