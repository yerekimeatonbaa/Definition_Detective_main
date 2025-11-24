import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import { NextRequest } from "next/server";
import { GENKIT_CLIENT_HEADER } from "genkit";
import run from "@genkit-ai/next";

import "@/ai/flows/game-sounds-flow";
import "@/ai/flows/generate-word-flow";
import "@/ai/flows/generate-hints";

genkit({
  plugins: [googleAI()],
});

export async function POST(req: NextRequest) {
  const isGenkitClient = req.headers.has(GENKIT_CLIENT_HEADER);
  const body = await req.json();
  const runAny: any = run;
  return await runAny(body, {
    isGenkitClient,
  });
}
