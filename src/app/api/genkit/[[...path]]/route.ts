
import { genkit } from 'genkit';
import { NextRequest } from 'next/server';
import '@/ai/flows/smart-word-hints';
import '@/ai/flows/game-sounds-flow';

export async function POST(request: NextRequest) {
  const { path, body } = await request.json();
  const result = await genkit.run(path, body);
  return new Response(JSON.stringify(result));
}
