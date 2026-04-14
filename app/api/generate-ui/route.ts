import { NextResponse } from "next/server";
import { generateFromPRD } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { requirements?: string };
    const requirements = body.requirements?.trim();

    if (!requirements) {
      return NextResponse.json(
        { error: "requirements is required" },
        { status: 400 }
      );
    }

    const result = await generateFromPRD(requirements);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Generation failed" },
      { status: 500 }
    );
  }
}
