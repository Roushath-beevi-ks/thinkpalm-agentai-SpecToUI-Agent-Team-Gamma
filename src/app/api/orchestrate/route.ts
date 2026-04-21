import { NextResponse } from "next/server";
import { runOrchestration } from "@/lib/agents/pipeline";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      requirements?: string;
      sessionId?: string;
    };
    const requirements = body.requirements?.trim();
    const sessionId =
      body.sessionId?.trim() ||
      `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    if (!requirements) {
      return NextResponse.json(
        { error: "requirements is required" },
        { status: 400 }
      );
    }

    const result = await runOrchestration(sessionId, requirements);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Orchestration failed" },
      { status: 500 }
    );
  }
}
